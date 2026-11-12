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
  const id = service.createLead(input, 'enquiry-retry-key-12345');
  assert.equal(service.createLead(input, 'enquiry-retry-key-12345'), id);
  assert.equal(service.allLeads().length, 1);
  assert.equal(service.allLeads()[0].status, 'New');
  assert.equal(service.allLeads()[0].source, 'Website');
  assert.equal(service.allLeads()[0].travelDate, '');
  assert.throws(() => service.createLead({ ...input, email: 'invalid' }), /email/);
  assert.throws(() => service.createLead({ ...input, travelers: 0 }), /travellers/);
  assert.throws(() => service.createLead({ ...input, travelDate: '2027-02-30' }), /travel date/);
  service.patchLead(id, {
    status: 'Contacted',
    owner: 'Abhi',
    nextFollowUp: '2027-01-20',
    notes: 'Called customer',
  });
  const saved = service.allLeads()[0];
  assert.equal(saved.owner, 'Abhi');
  assert.equal(saved.status, 'Contacted');
  assert.equal(saved.notes, 'Called customer');
  assert.equal(saved.nextFollowUp, '2027-01-20');
  assert.throws(() => service.patchLead(id, { status: 'Invalid' }), /status/);
  service.importLocalLeads([{ ...saved, status: 'New' }]);
  assert.equal(service.allLeads()[0].status, 'Contacted');
  console.log(
    'PASS: enquiry validation, flexible dates, duplicate-retry protection, Admin assignment/status/notes and safe local migration.',
  );
} finally {
  db().close();
}
