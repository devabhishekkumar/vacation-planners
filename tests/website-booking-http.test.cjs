require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  { spawn } = require('node:child_process'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const base = 'http://localhost:3130';
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '-p', '3130'],
  {
    env: {
      ...process.env,
      AUTH_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'vp-website-booking-')),
    },
    stdio: 'ignore',
  },
);
async function post(route, body, extra = {}) {
  return fetch(base + route, {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(body),
  });
}
function cookie(response) {
  const values = response.headers.getSetCookie();
  const value = values.findLast(
    (v) => v.startsWith('vp_customer_session=') && !v.startsWith('vp_customer_session=;'),
  );
  assert(value);
  assert.match(value, /HttpOnly/i);
  assert.match(value, /SameSite=lax/i);
  return value.split(';')[0];
}
(async () => {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + '/packages/bali-island-discovery')).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert(ready);
  const html = await (await fetch(base + '/packages/bali-island-discovery')).text();
  assert.match(html, /href="\/book\/bali-island-discovery"/);
  const input = {
    packageSlug: 'bali-island-discovery',
    customer: 'Public Booking Test',
    email: 'spoofed@example.test',
    phone: '9000011111',
    travelDate: '2099-01-10',
    returnDate: '2099-01-15',
    travelers: 2,
    amount: 1,
    status: 'Confirmed',
  };
  let r = await post('/api/booking-requests', input, {
    'Idempotency-Key': 'website-http-booking-key-12345',
  });
  assert.equal(r.status, 401);
  const denied = await r.json();
  assert.match(denied.loginUrl, /next=%2Fbook%2Fbali-island-discovery/);
  let gated = await fetch(base + '/book/bali-island-discovery', { redirect: 'manual' });
  let gatedHtml = await gated.text();
  assert(gated.status === 307 || gatedHtml.includes('/login/customer'));
  assert(!gatedHtml.includes('name="travelers"'));
  const credentials = {
    operation: 'signup',
    name: 'Customer A',
    email: 'customer-a@example.test',
    password: 'customer-a-password-123',
    confirm: 'customer-a-password-123',
    next: '/book/bali-island-discovery',
  };
  r = await post('/api/customer/auth', credentials);
  assert.equal(r.status, 200);
  const customerCookie = cookie(r);
  assert.equal((await r.json()).next, '/book/bali-island-discovery');
  let page = await fetch(base + '/book/bali-island-discovery', {
    headers: { Cookie: customerCookie },
  });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Request booking/);
  const headers = { 'Idempotency-Key': 'website-http-booking-key-12345', Cookie: customerCookie };
  r = await post('/api/booking-requests', input, headers);
  assert.equal(r.status, 201);
  const result = await r.json();
  assert.equal(result.status, 'Pending');
  assert.deepEqual(Object.keys(result).sort(), ['id', 'status']);
  r = await post('/api/booking-requests', input, headers);
  assert.equal((await r.json()).id, result.id);
  let snapshot = await (await fetch(base + '/api/bookings')).json();
  assert.equal(snapshot.bookings.length, 1);
  assert.equal(snapshot.bookings[0].amount, 0);
  assert.equal(snapshot.bookings[0].pricingPending, true);
  assert.equal(snapshot.bookings[0].email, 'customer-a@example.test');
  assert(snapshot.bookings[0].customerId);
  page = await fetch(base + '/customer', { headers: { Cookie: customerCookie } });
  assert.match(await page.text(), new RegExp(result.id));
  r = await post('/api/customer/auth', {
    ...credentials,
    name: 'Customer B',
    email: 'customer-b@example.test',
    next: 'https://untrusted.example',
  });
  assert.equal(r.status, 200);
  const secondCookie = cookie(r);
  assert.equal((await r.json()).next, '/customer');
  page = await fetch(base + '/customer', { headers: { Cookie: secondCookie } });
  assert(!(await page.text()).includes(result.id));
  r = await post('/api/booking-requests', input, { ...headers, Cookie: secondCookie });
  assert.equal(r.status, 400);
  r = await post('/api/customer/auth', {
    operation: 'login',
    email: credentials.email,
    password: credentials.password,
    next: '/book/bali-island-discovery',
  });
  assert.equal(r.status, 200);
  assert(cookie(r));
  r = await post('/api/customer/auth', {
    operation: 'login',
    email: credentials.email,
    password: 'wrong',
  });
  assert.equal(r.status, 400);
  r = await post('/api/bookings', { operation: 'price', id: result.id, amount: 45000 });
  assert.equal(r.status, 200);
  r = await post('/api/bookings', { operation: 'status', id: result.id, status: 'Confirmed' });
  assert.equal(r.status, 200);
  assert.equal((await fetch(base + '/admin/bookings')).status, 200);
  console.log(
    'PASS: Book now authentication gate, signup/login return path, session cookie, account-bound booking, customer history isolation, duplicate protection and Admin confirmation.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
