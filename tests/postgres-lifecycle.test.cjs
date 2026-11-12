require('./postgres-guard.cjs');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const ts = require('typescript');
const pg = require('pg');

// Use the installed pg Pool, with a controlled transport client. No live
// connections are killed and no application records are touched by fault tests.
let lastPool;
let clientSequence = 0;
let faults = [];
const commands = [];
const releases = [];
const diagnostics = [];
class TransportClient extends EventEmitter {
  constructor() {
    super();
    this.id = ++clientSequence;
    this._queryable = true;
    this._ending = false;
  }
  connect(callback) {
    queueMicrotask(() => callback(null));
  }
  query(sql, values, callback) {
    if (typeof values === 'function') callback = values;
    const result = Promise.resolve().then(() => {
      commands.push({ id: this.id, sql });
      if (!this._queryable)
        throw Error('Client has encountered a connection error and is not queryable');
      const index = faults.findIndex((fault) => fault.sql === sql);
      if (index >= 0) {
        const fault = faults.splice(index, 1)[0];
        if (fault.event) {
          this._queryable = false;
          this.emit('error', fault.error);
        }
        throw fault.error;
      }
      return { rows: [{ id: this.id }], rowCount: 1 };
    });
    if (callback) {
      result.then(
        (value) => callback(null, value),
        (error) => callback(error),
      );
      return;
    }
    return result;
  }
  end(callback) {
    this._ending = true;
    queueMicrotask(() => {
      this.emit('end');
      callback?.();
    });
  }
}
function observePool(pool) {
  lastPool = pool;
  pool.on('release', (error, client) => releases.push({ error, id: client.id }));
}
class ObservedPool extends pg.Pool {
  constructor(options) {
    super({ ...options, Client: TransportClient });
    observePool(this);
  }
}
const compiled = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/lib/auth/database.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
new Function('require', 'module', 'exports', 'console', code)(
  (name) =>
    name === 'pg'
      ? { ...pg, Pool: ObservedPool }
      : name === '@vercel/functions'
        ? { attachDatabasePool() {} }
        : require(name),
  compiled,
  compiled.exports,
  { error: (...values) => diagnostics.push(values) },
);
const database = compiled.exports.db();
const reset = () => Object.assign(Error('read ECONNRESET'), { code: 'ECONNRESET' });
async function fresh() {
  await database.close();
  faults = [];
  commands.length = 0;
  releases.length = 0;
  diagnostics.length = 0;
}

(async () => {
  try {
    const original = reset();
    faults = [
      { sql: 'BROKEN WRITE', error: original },
      {
        sql: 'ROLLBACK',
        error: Error('Client has encountered a connection error and is not queryable'),
      },
    ];
    await assert.rejects(
      () => database.transaction(() => database.run('BROKEN WRITE')),
      (error) => error === original,
    );
    assert.equal(
      commands.filter((command) => command.sql === 'BROKEN WRITE').length,
      1,
      'Never replay a write.',
    );
    assert.equal(releases.length, 1, 'Release exactly once after failed rollback.');
    assert(releases[0].error, 'Discard failed transaction clients.');
    assert.equal(lastPool.totalCount, 0);

    await fresh();
    const checkedOutReset = reset();
    let checkedOut;
    await assert.rejects(
      () =>
        database.transaction(async () => {
          checkedOut = (await database.get('SELECT connection')).id;
          const client = lastPool._clients.find((client) => client.id === checkedOut);
          assert(client.listenerCount('error') > 0, 'Checked-out clients need an error listener.');
          client._queryable = false;
          client.emit('error', checkedOutReset);
          await database.run('MUST NOT RUN');
        }),
      (error) => error === checkedOutReset,
    );
    assert(!commands.some((command) => command.sql === 'MUST NOT RUN'));
    assert(
      !commands.some((command) => command.sql === 'ROLLBACK'),
      'Do not query an already disconnected socket.',
    );
    assert(diagnostics.length > 0, 'Connection errors must remain observable.');
    assert.notEqual((await database.get('SELECT replacement')).id, checkedOut);

    await fresh();
    const commitReset = reset();
    let workCalls = 0;
    faults = [{ sql: 'COMMIT', error: commitReset, event: true }];
    await assert.rejects(
      () =>
        database.transaction(async () => {
          workCalls++;
          await database.run('PAYMENT WRITE');
        }),
      (error) => error === commitReset,
    );
    assert.equal(workCalls, 1, 'Never replay an ambiguous commit.');
    assert.equal(commands.filter((command) => command.sql === 'COMMIT').length, 1);
    assert.equal(commands.filter((command) => command.sql === 'PAYMENT WRITE').length, 1);
    assert(releases[0].error);

    await fresh();
    let resume;
    let lateQuery;
    const gate = new Promise((resolve) => {
      resume = resolve;
    });
    await database.transaction(async () => {
      lateQuery = gate.then(() => database.get('LATE QUERY'));
    });
    const count = commands.length;
    resume();
    await assert.rejects(lateQuery, /completed/);
    assert.equal(commands.length, count, 'Async descendants cannot reuse a released client.');

    await fresh();
    await database.transaction(() => database.transaction(() => database.run('NESTED WRITE')));
    assert.equal(new Set(commands.map((command) => command.id)).size, 1);
    assert.equal(commands.filter((command) => command.sql === 'BEGIN').length, 1);
    assert.equal(commands.filter((command) => command.sql === 'COMMIT').length, 1);
    assert.equal(releases.length, 1);
    assert(!releases[0].error);

    await fresh();
    const beginReset = reset();
    faults = [{ sql: 'BEGIN', error: beginReset, event: true }];
    let beganWork = false;
    await assert.rejects(
      () =>
        database.transaction(async () => {
          beganWork = true;
        }),
      (error) => error === beginReset,
    );
    assert.equal(beganWork, false);
    assert.equal(releases.length, 1);
    assert(releases[0].error);

    await fresh();
    const validation = Error('Business validation failed.');
    await assert.rejects(
      () =>
        database.transaction(async () => {
          throw validation;
        }),
      (error) => error === validation,
    );
    assert.equal(commands.filter((command) => command.sql === 'ROLLBACK').length, 1);
    assert.equal(releases.length, 1);
    assert(releases[0].error);

    await fresh();
    await database.get('SELECT idle');
    const idle = lastPool._clients[0];
    const idleId = idle.id;
    idle._queryable = false;
    idle.emit('error', reset());
    assert(diagnostics.length > 0);
    assert.notEqual((await database.get('SELECT after idle failure')).id, idleId);
    assert.equal(lastPool.options.max, 5);
    assert.equal(lastPool.options.idleTimeoutMillis, 5000);
    assert.equal(lastPool.options.keepAlive, true);
    const { migrate } = require('../scripts/postgres-tools.cjs');
    const migrationFailure = reset();
    const administrativeClient = {
      async query(sql) {
        if (sql.startsWith('CREATE TABLE')) throw migrationFailure;
        if (sql === 'ROLLBACK')
          throw Object.assign(Error('Controlled rollback disconnect'), { code: 'ECONNRESET' });
        return { rows: [] };
      },
    };
    await assert.rejects(
      () => migrate(administrativeClient),
      (error) => error === migrationFailure,
    );
    console.log(
      'PASS: real pg Pool evicts broken clients; original errors survive failed rollback; checked-out/idle disconnects are handled; commits and writes never replay; released async contexts are rejected; nested transactions keep one client.',
    );
  } finally {
    await database.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
