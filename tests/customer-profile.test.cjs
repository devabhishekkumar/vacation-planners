const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
process.env.AUTH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-customer-profile-'));
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const { db } = require('../src/lib/auth/database.ts'),
  { customerProfile, saveCustomerProfile } = require('../src/lib/auth/customer-profile.ts');
try {
  for (const id of ['first', 'second'])
    db()
      .prepare('INSERT INTO users VALUES(?,?,?,?,?,1)')
      .run(id, id, id + '@example.test', 'disabled', 'customer');
  assert.equal(customerProfile('first').phone, '');
  const input = {
    name: 'Updated Customer',
    phone: '+91 98447 57214',
    city: 'Bengaluru',
    address: 'Test address',
    preferences: 'Family holidays',
    email: 'spoofed@example.test',
    id: 'second',
  };
  let profile = saveCustomerProfile('first', input);
  assert.equal(profile.name, input.name);
  assert.equal(profile.phone, input.phone);
  assert.equal(profile.email, 'first@example.test');
  assert.equal(customerProfile('second').name, 'second');
  assert(profile.updatedAt);
  assert.throws(
    () => saveCustomerProfile('first', { ...input, phone: 'not-a-number' }),
    /valid phone/,
  );
  assert.throws(() => saveCustomerProfile('first', { ...input, name: 'x' }), /full name/);
  assert.throws(
    () => saveCustomerProfile('first', { ...input, address: 'a'.repeat(401) }),
    /no more than/,
  );
  assert.equal(customerProfile('first').name, input.name);
  db().prepare('UPDATE users SET active=0 WHERE id=?').run('second');
  assert.throws(() => saveCustomerProfile('second', input), /unavailable/);
  console.log(
    'PASS: profile defaults, contact persistence, immutable email, account isolation and field validation.',
  );
} finally {
  db().close();
}
