require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
process.env.AUTH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-enquiry-test-'));
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const service = require('../src/lib/lead-service.ts'),
  { db } = require('../src/lib/auth/database.ts');
(async () => {
  try {
    const input = {
      name: 'Test Traveller',
      email: 'traveller@example.test',
      phone: '+91 90000 11111',
      destination: 'Bali',
      travelDate: '',
      travelers: 2,
      notes: 'Family trip',
      source: 'Website',
    };
    const id = await service.createLead(input, 'enquiry-retry-key-12345');
    assert.equal(await service.createLead(input, 'enquiry-retry-key-12345'), id);
    assert.equal((await service.allLeads()).length, 1);
    assert.equal((await service.allLeads())[0].status, 'New');
    assert.equal((await service.allLeads())[0].source, 'Website');
    assert.equal((await service.allLeads())[0].travelDate, '');
    await assert.rejects(
      async () => await service.createLead({ ...input, email: 'invalid' }),
      /email/,
    );
    await assert.rejects(
      async () => await service.createLead({ ...input, travelers: 0 }),
      /travellers/,
    );
    await assert.rejects(
      async () => await service.createLead({ ...input, travelDate: '2027-02-30' }),
      /travel date/,
    );
    await service.patchLead(id, {
      status: 'Contacted',
      owner: 'Abhi',
      nextFollowUp: '2027-01-20',
      notes: 'Called customer',
    });
    const saved = (await service.allLeads())[0];
    assert.equal(saved.owner, 'Abhi');
    assert.equal(saved.status, 'Contacted');
    assert.equal(saved.notes, 'Called customer');
    assert.equal(saved.nextFollowUp, '2027-01-20');
    await assert.rejects(async () => await service.patchLead(id, { status: 'Invalid' }), /status/);
    await service.importLocalLeads([{ ...saved, status: 'New' }]);
    assert.equal((await service.allLeads())[0].status, 'Contacted');
    console.log(
      'PASS: enquiry validation, flexible dates, duplicate-retry protection, Admin assignment/status/notes and safe local migration.',
    );
  } finally {
    await db().close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
