require('./postgres-guard.cjs');
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
(async () => {
  try {
    for (const id of ['first', 'second'])
      await db().run(
        'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1)',
        id,
        id,
        id + '@example.test',
        'disabled',
        'customer',
      );
    assert.equal((await customerProfile('first')).phone, '');
    const input = {
      name: 'Updated Customer',
      phone: '+91 98447 57214',
      city: 'Bengaluru',
      address: 'Test address',
      preferences: 'Family holidays',
      email: 'spoofed@example.test',
      id: 'second',
    };
    let profile = await saveCustomerProfile('first', input);
    assert.equal(profile.name, input.name);
    assert.equal(profile.phone, input.phone);
    assert.equal(profile.email, 'first@example.test');
    assert.equal((await customerProfile('second')).name, 'second');
    assert(profile.updatedAt);
    await assert.rejects(
      async () => await saveCustomerProfile('first', { ...input, phone: 'not-a-number' }),
      /valid phone/,
    );
    await assert.rejects(
      async () => await saveCustomerProfile('first', { ...input, name: 'x' }),
      /full name/,
    );
    await assert.rejects(
      async () => await saveCustomerProfile('first', { ...input, address: 'a'.repeat(401) }),
      /no more than/,
    );
    assert.equal((await customerProfile('first')).name, input.name);
    await db().run('UPDATE users SET active=0 WHERE id=$1', 'second');
    await assert.rejects(async () => await saveCustomerProfile('second', input), /unavailable/);
    console.log(
      'PASS: profile defaults, contact persistence, immutable email, account isolation and field validation.',
    );
  } finally {
    await db().close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
