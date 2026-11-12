const assert = require('node:assert/strict'),
  { spawn } = require('node:child_process'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const base = 'http://localhost:3128';
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '-p', '3128'],
  {
    env: {
      ...process.env,
      AUTH_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'vp-booking-http-')),
    },
    stdio: 'ignore',
  },
);
async function post(body, origin = base) {
  return fetch(base + '/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}
(async () => {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + '/api/bookings')).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert(ready);
  assert.equal((await fetch(base + '/admin/bookings')).status, 200);
  assert.equal((await fetch(base + '/admin/payments')).status, 200);
  assert.equal((await post({ operation: 'create' }, 'https://untrusted.example')).status, 403);
  let response = await post({
    operation: 'create',
    item: {
      customer: 'HTTP Test',
      tour: 'Test journey',
      travelDate: '2027-01-01',
      travelers: 2,
      amount: 5000,
      quoteId: '',
    },
  });
  assert.equal(response.status, 200);
  let snapshot = await response.json();
  const id = snapshot.bookings[0].id;
  response = await post({
    operation: 'payment',
    item: { bookingId: id, amount: 2000, method: 'UPI', reference: 'HTTP-ADVANCE' },
  });
  assert.equal(response.status, 200);
  snapshot = await response.json();
  assert.equal(snapshot.bookings[0].paid, 2000);
  response = await post({
    operation: 'payment',
    item: { bookingId: id, amount: 4000, method: 'UPI', reference: 'HTTP-OVERPAY' },
  });
  assert.equal(response.status, 400);
  snapshot = await (await fetch(base + '/api/bookings')).json();
  assert.equal(snapshot.payments.length, 1);
  assert.equal(snapshot.bookings[0].amount - snapshot.bookings[0].paid, 3000);
  console.log(
    'PASS: booking/payment pages, API persistence, origin checks and overpayment rejection.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
