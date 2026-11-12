const assert = require('node:assert/strict'),
  { spawn } = require('node:child_process'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const base = 'http://localhost:3131';
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '-p', '3131'],
  {
    env: {
      ...process.env,
      AUTH_DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'vp-profile-http-')),
    },
    stdio: 'ignore',
  },
);
async function post(route, body, cookie = '', origin = base) {
  return fetch(base + route, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
}
function session(response) {
  const cookie = response.headers
    .getSetCookie()
    .findLast(
      (v) => v.startsWith('vp_customer_session=') && !v.startsWith('vp_customer_session=;'),
    );
  assert(cookie);
  return cookie.split(';')[0];
}
async function signup(email) {
  const r = await post('/api/customer/auth', {
    operation: 'signup',
    name: 'Profile Test',
    email,
    password: 'profile-password-123',
    confirm: 'profile-password-123',
    next: '/customer/profile',
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).next, '/customer/profile');
  return session(r);
}
(async () => {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + '/api/customer/profile')).status === 401) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert(ready);
  assert.equal((await (await fetch(base + '/api/customer/session')).json()).user, null);
  assert.equal((await post('/api/customer/profile', { name: 'Unauthenticated' })).status, 401);
  const first = await signup('profile-a@example.test'),
    second = await signup('profile-b@example.test');
  let r = await post(
    '/api/customer/profile',
    {
      name: 'Updated Profile',
      phone: '+91 98447 57214',
      city: 'Bengaluru',
      address: 'Test address',
      preferences: 'Beach holidays',
      email: 'profile-b@example.test',
      id: 'some-other-account',
    },
    first,
  );
  assert.equal(r.status, 200);
  let data = await r.json();
  const sessionInfo = await (
    await fetch(base + '/api/customer/session', { headers: { Cookie: first } })
  ).json();
  assert.equal(sessionInfo.user.name, 'Updated Profile');
  assert.deepEqual(Object.keys(sessionInfo.user).sort(), ['email', 'name']);
  assert.equal(data.email, 'profile-a@example.test');
  assert.equal(data.city, 'Bengaluru');
  data = await (
    await fetch(base + '/api/customer/profile', { headers: { Cookie: second } })
  ).json();
  assert.equal(data.name, 'Profile Test');
  assert.equal(data.city, '');
  r = await post(
    '/api/customer/profile',
    { name: 'Wrong origin' },
    first,
    'https://untrusted.example',
  );
  assert.equal(r.status, 403);
  r = await fetch(base + '/customer/profile', { headers: { Cookie: first } });
  assert.equal(r.status, 200);
  let html = await r.text();
  assert.match(html, /Updated Profile/);
  assert.match(html, /Bengaluru/);
  assert.match(html, /Save profile/);
  r = await fetch(base + '/book/bali-island-discovery', { headers: { Cookie: first } });
  html = await r.text();
  assert.match(html, /Updated Profile/);
  assert.match(html, /98447/);
  console.log(
    'PASS: signed-in profile page/save, unauthenticated and cross-origin rejection, customer isolation and booking prefill.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
