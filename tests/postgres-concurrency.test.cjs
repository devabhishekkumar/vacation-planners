require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  Module = require('node:module'),
  ts = require('typescript');
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const service = require('../src/lib/booking-service.ts'),
  content = require('../src/lib/content/service.ts'),
  travel = require('../src/lib/travel/service.ts'),
  { db } = require('../src/lib/auth/database.ts');
(async () => {
  try {
    await db().run(
      'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1)',
      'concurrent-customer',
      'Customer',
      'concurrent@example.test',
      'disabled',
      'customer',
    );
    const input = {
      customer: 'Customer',
      tour: 'Trip',
      travelDate: '2099-01-01',
      travelers: 2,
      amount: 1000,
      customerId: 'concurrent-customer',
    };
    const booking = (await service.createBooking(input)).bookings[0];
    const payments = await Promise.allSettled(
      [1, 2].map((i) =>
        service.recordBookingPayment({
          bookingId: booking.id,
          amount: 700,
          method: 'Bank',
          reference: 'reference-' + i,
        }),
      ),
    );
    assert.equal(payments.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal((await service.bookingSnapshot()).bookings[0].paid, 700);
    const packageSlug = (await content.getSiteContent()).packages[0].slug;
    const website = {
      ...input,
      packageSlug,
      email: 'concurrent@example.test',
      phone: '1234567890',
    };
    const requests = await Promise.all(
      [1, 2].map(() =>
        service.createWebsiteBooking(website, 'concurrent-request-123', 'concurrent-customer'),
      ),
    );
    assert.equal(requests[0].id, requests[1].id);
    const snapshot = await content.contentSnapshot();
    const publications = await Promise.allSettled(
      [1, 2].map(() => content.publishContent(snapshot.revision, snapshot.content)),
    );
    assert.equal(publications.filter((r) => r.status === 'fulfilled').length, 1);
    const actor = { admin: true };
    const trip = await travel.travelSnapshot(booking.id, actor);
    const revisions = await Promise.allSettled(
      [1, 2].map(() =>
        travel.mutateTravel(booking.id, actor, {
          revision: trip.revision,
          operation: 'coordinator',
          coordinator: { name: 'Support', phone: '', email: '' },
        }),
      ),
    );
    assert.equal(revisions.filter((r) => r.status === 'fulfilled').length, 1);
    console.log(
      'PASS: concurrent payments cannot overpay; booking retries deduplicate; content and trip revisions reject competing stale writes.',
    );
  } finally {
    await db().close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
