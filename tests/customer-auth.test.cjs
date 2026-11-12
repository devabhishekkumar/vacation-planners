require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
process.env.AUTH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-customer-auth-'));
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const auth = require('../src/lib/auth/customer-account.ts'),
  { db } = require('../src/lib/auth/database.ts');
(async () => {
  const input = {
    name: 'Customer Test',
    email: 'CUSTOMER@example.test',
    password: 'customer-password-123',
    confirm: 'customer-password-123',
  };
  const user = await auth.signupCustomer(input);
  assert.equal(user.email, 'customer@example.test');
  let stored = await db().get('SELECT * FROM users WHERE id=$1', user.id);
  assert.equal(stored.role, 'customer');
  assert.notEqual(stored.password, input.password);
  assert.equal(
    (await auth.loginCustomer({ email: input.email, password: input.password })).id,
    user.id,
  );
  await assert.rejects(
    async () => await auth.loginCustomer({ email: input.email, password: 'wrong' }),
    /Invalid email/,
  );
  await assert.rejects(async () => await auth.signupCustomer(input), /already exists/);
  await assert.rejects(
    async () =>
      await auth.signupCustomer({
        ...input,
        email: 'new@example.test',
        password: 'short',
        confirm: 'short',
      }),
    /12 to 128/,
  );
  await assert.rejects(
    async () =>
      await auth.signupCustomer({ ...input, email: 'new@example.test', confirm: 'mismatch' }),
    /do not match/,
  );
  await db().run('UPDATE users SET active=0 WHERE id=$1', user.id);
  await assert.rejects(
    async () => await auth.loginCustomer({ email: input.email, password: input.password }),
    /Invalid email/,
  );
  for (const next of [
    'https://example.com',
    '//example.com',
    '/admin',
    '/book/../admin',
    '/book/test?next=//example.com',
  ])
    assert.equal(auth.customerNext(next), '/customer');
  assert.equal(auth.customerNext('/book/bali-island-discovery'), '/book/bali-island-discovery');
  for (let i = 0; i < 5; i++)
    await assert.rejects(
      async () => await auth.loginCustomer({ email: 'unknown@example.test', password: 'wrong' }),
    );
  await assert.rejects(
    async () => await auth.loginCustomer({ email: 'unknown@example.test', password: 'wrong' }),
    /Too many/,
  );
  const originalRun = db().run;
  const disconnected = Object.assign(Error('read ECONNRESET'), { code: 'ECONNRESET' });
  let inserts = 0;
  db().run = async function (sql, ...values) {
    if (sql.startsWith('INSERT INTO users')) {
      inserts++;
      throw disconnected;
    }
    return originalRun.call(this, sql, ...values);
  };
  try {
    await assert.rejects(
      () => auth.signupCustomer({ ...input, email: 'connection-failure@example.test' }),
      (error) => error === disconnected,
    );
    assert.equal(
      inserts,
      1,
      'Do not retry registration writes or report a reset as a duplicate account.',
    );
  } finally {
    db().run = originalRun;
  }
  assert.equal(
    await db().get('SELECT id FROM users WHERE email=$1', 'connection-failure@example.test'),
    undefined,
  );
  console.log(
    'PASS: customer signup/login, password hashing, duplicate accounts, inactive accounts, rate limits and safe return URLs.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => await db().close());
