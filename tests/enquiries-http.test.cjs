const assert = require('node:assert/strict'),
  { spawn } = require('node:child_process'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const base = 'http://localhost:3129';
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '-p', '3129'],
  {
    env: {
      ...process.env,
      AUTH_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'vp-enquiry-http-')),
    },
    stdio: 'ignore',
  },
);
async function post(url, body, extra = {}) {
  return fetch(base + url, {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(body),
  });
}
(async () => {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + '/contact')).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert(ready);
  const data = {
    name: 'Website Test',
    email: 'website@example.test',
    phone: '9000011111',
    destination: 'Bali',
    date: '',
    travellers: '3',
    message: 'A family holiday',
    packageName: 'Bali Escape',
  };
  let response = await post('/api/enquiries', data, {
    'Idempotency-Key': 'website-retry-key-1234567',
  });
  assert.equal(response.status, 201);
  const { id } = await response.json();
  assert(id);
  response = await post('/api/enquiries', data, { 'Idempotency-Key': 'website-retry-key-1234567' });
  assert.equal((await response.json()).id, id);
  const snapshot = await (await fetch(base + '/api/admin/leads')).json();
  assert.equal(snapshot.leads.length, 1);
  const lead = snapshot.leads[0];
  assert.equal(lead.source, 'Website');
  assert.equal(lead.status, 'New');
  assert.match(lead.notes, /Bali Escape/);
  assert.equal(lead.travelers, 3);
  response = await post('/api/admin/leads', {
    operation: 'patch',
    id,
    changes: { owner: 'Team Test', status: 'Follow-up', nextFollowUp: '2027-01-20' },
  });
  assert.equal(response.status, 200);
  const reloaded = await (await fetch(base + '/api/admin/leads')).json();
  assert.equal(reloaded.leads[0].owner, 'Team Test');
  assert.equal(reloaded.leads[0].nextFollowUp, '2027-01-20');
  assert.equal((await fetch(base + '/admin/leads')).status, 200);
  const html = await (await fetch(base + '/contact')).text();
  assert.match(html, /Send enquiry/);
  assert(!html.includes('Preview my enquiry'));
  console.log(
    'PASS: website form submission reaches Admin, retries do not duplicate, and assignments/status/follow-up survive reload.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
