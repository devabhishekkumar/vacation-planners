require('./postgres-guard.cjs');
(async () => {
  const assert = require('node:assert/strict'),
    { spawn } = require('node:child_process'),
    fs = require('node:fs'),
    os = require('node:os'),
    path = require('node:path'),
    Module = require('node:module'),
    ts = require('typescript');
  process.env.AUTH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-review-http-'));
  Module._extensions['.ts'] = (m, p) =>
    m._compile(
      ts.transpileModule(fs.readFileSync(p, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      }).outputText,
      p,
    );
  const { createReview, setReviewPublished } = require('../src/lib/reviews.ts'),
    { db } = require('../src/lib/auth/database.ts');
  const input = {
    name: 'HTTP Test Reviewer',
    destination: 'Test destination',
    rating: 4,
    body: 'Isolated test review for checking the website publication flow.',
    permission: true,
    published: true,
  };
  const id = await createReview(input);
  await createReview({ ...input, name: 'Second Test Reviewer' });
  await createReview({ ...input, name: 'Draft Test Reviewer', published: false });
  const base = 'http://localhost:3132',
    server = spawn(
      process.execPath,
      [require.resolve('next/dist/bin/next'), 'start', '-p', '3132'],
      {
        env: process.env,
        stdio: 'ignore',
      },
    );
  (async () => {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(base + '/api/reviews')).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert(ready);
    let data = await (await fetch(base + '/api/reviews')).json();
    assert.equal(data.reviews.length, 2);
    assert(!data.reviews.some((r) => r.name === 'Draft Test Reviewer'));
    await setReviewPublished(id, false);
    data = await (await fetch(base + '/api/reviews')).json();
    assert.equal(data.reviews.length, 1);
    for (const route of ['/', '/reviews', '/admin/reviews'])
      assert.equal((await fetch(base + route)).status, 200);
    const page = await (await fetch(base + '/admin/reviews')).text();
    assert.match(page, /Add a review/);
    assert.match(page, /Unpublish/);
    const unsigned = await fetch(base + '/api/reviews', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'A genuine review test with enough characters.' }),
    });
    assert.equal(unsigned.status, 401);
    const auth = await fetch(base + '/api/customer/auth', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'signup',
        name: 'Submitting Customer',
        email: 'reviewer@example.test',
        password: 'reviewer-password-123',
        confirm: 'reviewer-password-123',
        next: '/reviews/write',
      }),
    });
    assert.equal(auth.status, 200);
    assert.equal((await auth.json()).next, '/reviews/write');
    const cookie = auth.headers
      .getSetCookie()
      .findLast(
        (value) =>
          value.startsWith('vp_customer_session=') && !value.startsWith('vp_customer_session=;'),
      )
      .split(';')[0];
    const form = await fetch(base + '/reviews/write', { headers: { Cookie: cookie } });
    assert.equal(form.status, 200);
    assert.match(await form.text(), /Submit review/);
    const submission = await fetch(base + '/api/reviews', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        name: 'Spoofed Name',
        body: 'An isolated customer submission test with enough characters.',
        destination: 'Test trip',
        rating: 4,
        permission: true,
        published: true,
      }),
    });
    assert.equal(submission.status, 201);
    const submitted = await submission.json();
    assert.equal(submitted.status, 'pending');
    data = await (await fetch(base + '/api/reviews')).json();
    assert(!data.reviews.some((r) => r.id === submitted.id));
    const stored = (await require('../src/lib/reviews.ts').reviews(false)).find(
      (r) => r.id === submitted.id,
    );
    assert.equal(stored.name, 'Submitting Customer');
    assert.equal(stored.published, false);
    console.log(
      'PASS: published-only reviews API, live unpublishing homepage/reviews/Admin routes, customer review login and draft moderation.',
    );
  })()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(async () => {
      server.kill();
      await db().close();
    });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
