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
  let stored = db().prepare('SELECT * FROM users WHERE id=?').get(user.id);
  assert.equal(stored.role, 'customer');
  assert.notEqual(stored.password, input.password);
  assert.equal(
    (await auth.loginCustomer({ email: input.email, password: input.password })).id,
    user.id,
  );
  await assert.rejects(
    () => auth.loginCustomer({ email: input.email, password: 'wrong' }),
    /Invalid email/,
  );
  await assert.rejects(() => auth.signupCustomer(input), /already exists/);
  await assert.rejects(
    () =>
      auth.signupCustomer({
        ...input,
        email: 'new@example.test',
        password: 'short',
        confirm: 'short',
      }),
    /12 to 128/,
  );
  await assert.rejects(
    () => auth.signupCustomer({ ...input, email: 'new@example.test', confirm: 'mismatch' }),
    /do not match/,
  );
  db().prepare('UPDATE users SET active=0 WHERE id=?').run(user.id);
  await assert.rejects(
    () => auth.loginCustomer({ email: input.email, password: input.password }),
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
    await assert.rejects(() =>
      auth.loginCustomer({ email: 'unknown@example.test', password: 'wrong' }),
    );
  await assert.rejects(
    () => auth.loginCustomer({ email: 'unknown@example.test', password: 'wrong' }),
    /Too many/,
  );
  console.log(
    'PASS: customer signup/login, password hashing, duplicate accounts, inactive accounts, rate limits and safe return URLs.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db().close());
