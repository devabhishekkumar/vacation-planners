require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-content-test-'));
process.env.AUTH_DATA_DIR = directory;
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const content = require('../src/lib/content/service.ts'),
  { db } = require('../src/lib/auth/database.ts');
(async () => {
  try {
    const initial = await content.contentSnapshot();
    assert.equal(initial.revision, 0);
    content.validateContent(initial.content);
    const changed = structuredClone(initial.content);
    changed.packages[0].title = 'Updated holiday';
    changed.destinations[0].name = 'Updated destination';
    changed.galleryItems[0].title = 'Updated gallery';
    changed.articleCards[0].title = 'Updated article';
    const published = await content.publishContent(0, changed);
    assert.equal(published.revision, 1);
    assert.equal((await content.getSiteContent()).packages[0].title, 'Updated holiday');
    assert.equal(
      (await content.getPublishedPackage(changed.packages[0].slug)).title,
      'Updated holiday',
    );
    await assert.rejects(async () => await content.publishContent(0, changed), /changed elsewhere/);
    const invalid = structuredClone(changed);
    invalid.packages[0].destinationSlug = 'missing';
    await assert.rejects(
      async () => await content.publishContent(1, invalid),
      /existing destination/,
    );
    assert.equal((await content.contentSnapshot()).revision, 1);
    invalid.packages[0].destinationSlug = changed.packages[0].destinationSlug;
    invalid.packages[0].image = 'http://127.0.0.1/private';
    assert.throws(() => content.validateContent(invalid), /HTTPS/);
    invalid.packages[0].image = 'javascript:alert(1)';
    assert.throws(() => content.validateContent(invalid), /HTTPS/);
    invalid.packages[0].image = changed.packages[0].image;
    invalid.destinations.push(invalid.destinations[0]);
    assert.throws(() => content.validateContent(invalid), /unique/);
    const added = structuredClone(changed);
    added.packages.push({
      ...added.packages[0],
      slug: 'new-customer-holiday',
      title: 'New holiday',
    });
    await content.publishContent(1, added);
    assert.ok(await content.getPublishedPackage('new-customer-holiday'));
    console.log(
      'Content management checks passed: existing defaults, publish persistence, package lookup, destination/gallery/blog edits, conflict rollback, invalid references, duplicate URLs and unsafe images.',
    );
  } finally {
    await db().close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
