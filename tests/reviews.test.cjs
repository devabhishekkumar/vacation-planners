require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
process.env.AUTH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-review-test-'));
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const { reviews, createReview, setReviewPublished } = require('../src/lib/reviews.ts'),
  { db } = require('../src/lib/auth/database.ts');
(async () => {
  try {
    assert.equal((await reviews()).length, 0);
    const input = {
      name: 'Test Reviewer',
      destination: 'Test trip',
      rating: 4,
      body: 'This is test feedback used only inside an isolated test database.',
      permission: true,
      published: false,
    };
    await assert.rejects(
      async () => await createReview({ ...input, permission: false }),
      /permission/,
    );
    await assert.rejects(async () => await createReview({ ...input, rating: 6 }), /rating/);
    await assert.rejects(async () => await createReview({ ...input, body: 'short' }), /20 to 1500/);
    const id = await createReview(input);
    assert.equal((await reviews()).length, 0);
    assert.equal((await reviews(false)).length, 1);
    await setReviewPublished(id, true);
    assert.equal((await reviews()).length, 1);
    assert.equal((await reviews())[0].rating, 4);
    await setReviewPublished(id, false);
    assert.equal((await reviews()).length, 0);
    assert.equal((await reviews(false)).length, 1);
    await assert.rejects(async () => await setReviewPublished('missing', true), /not found/);
    console.log(
      'PASS: no seeded reviews, validation, permission checks, draft filtering, publishing and unpublishing.',
    );
  } finally {
    await db().close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
