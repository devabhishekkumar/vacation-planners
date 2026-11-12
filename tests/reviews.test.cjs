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
try {
  assert.equal(reviews().length, 0);
  const input = {
    name: 'Test Reviewer',
    destination: 'Test trip',
    rating: 4,
    body: 'This is test feedback used only inside an isolated test database.',
    permission: true,
    published: false,
  };
  assert.throws(() => createReview({ ...input, permission: false }), /permission/);
  assert.throws(() => createReview({ ...input, rating: 6 }), /rating/);
  assert.throws(() => createReview({ ...input, body: 'short' }), /20 to 1500/);
  const id = createReview(input);
  assert.equal(reviews().length, 0);
  assert.equal(reviews(false).length, 1);
  setReviewPublished(id, true);
  assert.equal(reviews().length, 1);
  assert.equal(reviews()[0].rating, 4);
  setReviewPublished(id, false);
  assert.equal(reviews().length, 0);
  assert.equal(reviews(false).length, 1);
  assert.throws(() => setReviewPublished('missing', true), /not found/);
  console.log(
    'PASS: no seeded reviews, validation, permission checks, draft filtering, publishing and unpublishing.',
  );
} finally {
  db().close();
}
