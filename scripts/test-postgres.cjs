const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { connect, migrate, report } = require('./postgres-tools.cjs');
async function run(file) {
  const schema = 'vp_test_' + randomUUID().replaceAll('-', '');
  process.env.DATABASE_SCHEMA = schema;
  const client = await connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await migrate(client);
    // Do not keep an administrative connection idle during a long HTTP test.
    await client.end();
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [file], {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_SCHEMA: schema },
      });
      child.on('error', reject);
      child.on('exit', resolve);
    });
    if (code !== 0) throw Error('Test failed: ' + file);
  } finally {
    // schema is a generated identifier, never a user-provided name.
    await client.end();
    const cleanup = await connect();
    try {
      await cleanup.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await cleanup.end();
    }
  }
}
(async () => {
  const args = process.argv.slice(2);
  const files = args.length
    ? args
    : fs
        .readdirSync('tests')
        .filter((f) => f.endsWith('.test.cjs'))
        .map((f) => 'tests/' + f);
  let failures = 0;
  for (const file of files) {
    try {
      await run(file);
    } catch (error) {
      report(error);
      failures++;
    }
  }
  if (failures) throw Error(failures + ' test files failed.');
  console.log('All PostgreSQL test suites passed.');
})().catch(report);
