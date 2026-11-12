require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  { spawn } = require('node:child_process'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  { randomBytes } = require('node:crypto');
// The old random range included Fetch-blocked ports such as 4190 (Sieve).
const port = '3135';
const base = 'http://localhost:' + port,
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-travel-http-')),
  key = randomBytes(32).toString('hex');
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '-p', port],
  {
    env: { ...process.env, AUTH_DATA_DIR: directory, TRAVEL_ADMIN_KEY: key },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let logs = '';
for (const stream of [server.stdout, server.stderr])
  stream.on('data', (chunk) => {
    logs = (logs + chunk.toString()).slice(-5000);
  });
async function request(route, body, cookie = '', extra = {}) {
  return fetch(base + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Origin: base,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function cookie(response, name) {
  const value = response.headers
    .getSetCookie()
    .findLast((v) => v.startsWith(name + '=') && !v.startsWith(name + '=;'));
  assert.ok(value);
  assert.match(value, /HttpOnly/i);
  return value.split(';')[0];
}
async function json(response, status = 200) {
  assert.equal(response.status, status, await response.clone().text());
  return response.json();
}
(async () => {
  try {
    let ready = false;
    let readinessError = '';
    for (let i = 0; i < 120; i++) {
      try {
        const response = await fetch(base + '/api/travel/session', {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          ready = true;
          break;
        }
        readinessError = 'HTTP ' + response.status;
      } catch (error) {
        readinessError = error.cause?.message || error.message;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready, readinessError + '\n' + logs);
    assert.equal((await request('/api/content')).status, 401);
    assert.equal((await request('/api/travel/missing')).status, 401);
    assert.equal(
      (await request('/api/travel/session', { key }, '', { Origin: 'https://attacker.invalid' }))
        .status,
      403,
    );
    assert.equal((await request('/api/travel/session', { key: 'wrong' })).status, 401);
    let response = await request('/api/travel/session', { key });
    await json(response);
    const operator = cookie(response, 'vp_travel_operator');
    const register = async (name, email) => {
      const r = await request('/api/customer/auth', {
        operation: 'signup',
        name,
        email,
        password: 'TestPassword123!',
        confirm: 'TestPassword123!',
        next: '/customer/travel',
      });
      await json(r);
      return cookie(r, 'vp_customer_session');
    };
    const customer = await register('Travel Customer', 'travel@example.test'),
      other = await register('Other Customer', 'other@example.test');
    let content = await json(await request('/api/content', undefined, operator));
    const slug = content.content.packages[0].slug;
    const booking = await json(
      await request(
        '/api/booking-requests',
        {
          packageSlug: slug,
          customer: 'Travel Customer',
          phone: '+91 90000 11111',
          travelDate: '2099-01-01',
          returnDate: '2099-01-07',
          travelers: 2,
        },
        customer,
        { 'Idempotency-Key': 'travel-feature-http-request-001' },
      ),
      201,
    );
    const endpoint = '/api/travel/' + booking.id;
    assert.equal((await request(endpoint, undefined, other)).status, 404);
    assert.equal(
      (
        await request(
          endpoint,
          { operation: 'coordinator', revision: 0, coordinator: {} },
          customer,
        )
      ).status,
      403,
    );
    let trip = await json(await request(endpoint, undefined, operator));
    const mutate = async (body) => {
      trip = await json(await request(endpoint, { revision: trip.revision, ...body }, operator));
      return trip;
    };
    await mutate({
      operation: 'service-save',
      kind: 'hotel',
      status: 'Pending',
      fields: {
        name: 'HTTP Hotel',
        address: 'Goa',
        contact: '+91 90000 22222',
        room: 'Deluxe',
        checkin: '2099-01-01',
        checkout: '2099-01-06',
        confirmation: 'HOTEL-001',
      },
    });
    const hotelId = trip.services[0].id;
    const form = new FormData();
    form.set('revision', String(trip.revision));
    form.set('serviceId', hotelId);
    form.set(
      'file',
      new Blob(['%PDF-1.4\nTest ticket'], { type: 'application/pdf' }),
      'hotel-voucher.pdf',
    );
    response = await fetch(base + endpoint, {
      method: 'POST',
      headers: { Origin: base, Cookie: operator },
      body: form,
    });
    trip = await json(response);
    const doc = '/api/travel/documents/' + trip.documents[0].id;
    assert.equal((await request(doc)).status, 401);
    assert.equal((await request(doc, undefined, customer)).status, 404);
    assert.equal((await request(doc, undefined, other)).status, 404);
    await mutate({ operation: 'service-confirm', id: hotelId });
    response = await request(doc, undefined, customer);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /attachment/);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.ok((await response.text()).startsWith('%PDF-'));
    assert.equal(
      (await request(endpoint, { revision: 0, operation: 'service-delete', id: hotelId }, operator))
        .status,
      409,
    );
    const activity = {
      id: 'day-one-arrival',
      day: 1,
      time: '09:00',
      title: 'Airport arrival',
      location: 'Airport',
      notes: 'Meet your driver',
      status: 'Pending',
    };
    await mutate({ operation: 'itinerary-save', itinerary: [activity] });
    assert.equal((await json(await request(endpoint, undefined, customer))).itinerary.length, 0);
    assert.equal((await request(endpoint + '/itinerary', undefined, customer)).status, 404);
    await mutate({ operation: 'itinerary-publish', itinerary: [activity] });
    assert.equal((await json(await request(endpoint, undefined, customer))).itinerary.length, 1);
    await mutate({
      operation: 'itinerary-save',
      itinerary: [{ ...activity, title: 'PRIVATE DRAFT' }],
    });
    response = await request(endpoint + '/itinerary', undefined, customer);
    assert.equal(response.status, 200);
    const pdf = await response.text();
    assert.ok(pdf.includes('Airport arrival'));
    assert.ok(!pdf.includes('PRIVATE DRAFT'));
    assert.equal((await request(endpoint + '/itinerary', undefined, other)).status, 404);
    await mutate({
      operation: 'coordinator',
      coordinator: {
        name: 'Trip Coordinator',
        phone: '+91 90000 33333',
        email: 'travel-support@example.test',
      },
    });
    let own = await json(await request(endpoint, undefined, customer));
    assert.equal(own.coordinator.name, 'Trip Coordinator');
    assert.ok(own.notifications.some((n) => !n.read));
    own = await json(await request(endpoint, { operation: 'notices-read' }, customer));
    assert.ok(own.notifications.every((n) => n.read));
    assert.equal(
      (await request('/api/content', { revision: 0, content: content.content }, customer)).status,
      401,
    );
    const updated = structuredClone(content.content);
    updated.packages[0].title = 'Published HTTP Holiday';
    updated.destinations[0].name = 'Published HTTP Destination';
    updated.galleryItems[0].title = 'Published HTTP Gallery';
    updated.articleCards[0].title = 'Published HTTP Journal';
    content = await json(
      await request('/api/content', { revision: content.revision, content: updated }, operator),
    );
    assert.equal(content.revision, 1);
    for (const [route, text] of [
      ['/packages', 'Published HTTP Holiday'],
      ['/packages/' + slug, 'Published HTTP Holiday'],
      ['/destinations', 'Published HTTP Destination'],
      ['/gallery', 'Published HTTP Gallery'],
      ['/blog', 'Published HTTP Journal'],
    ]) {
      response = await request(route);
      assert.equal(response.status, 200, route);
      assert.ok((await response.text()).includes(text), route + ' did not update');
    }
    assert.equal(
      (await request('/api/content', { revision: 0, content: updated }, operator)).status,
      409,
    );
    for (const [route, session] of [
      ['/admin/content', operator],
      ['/admin/travel/' + booking.id, operator],
      ['/customer/travel/' + booking.id, customer],
      ['/customer/travel', customer],
    ])
      assert.equal((await request(route, undefined, session)).status, 200, route);
    response = await fetch(base + '/api/travel/session', {
      method: 'DELETE',
      headers: { Origin: base, Cookie: operator },
    });
    assert.equal(response.status, 200);
    assert.equal((await request(endpoint, undefined, operator)).status, 401);
    console.log(
      'PASS: operator sessions, CSRF, own-booking isolation, private multipart uploads/downloads, confirmations, conflict checks, unpublished itinerary isolation, PDF, notifications, protected CMS publish, and public website updates.',
    );
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    server.kill();
    if (server.exitCode === null)
      await Promise.race([
        new Promise((resolve) => server.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
