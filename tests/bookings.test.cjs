require('./postgres-guard.cjs');
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
process.env.AUTH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-booking-test-'));
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const service = require('../src/lib/booking-service.ts'),
  { db } = require('../src/lib/auth/database.ts');
(async () => {
  try {
    const input = {
      customer: 'Test Traveller',
      tour: 'Bali',
      travelDate: '2027-03-10',
      returnDate: '2027-03-15',
      travelers: 2,
      amount: 10000,
      quoteId: '',
      passengers: 'Traveller One\nTraveller Two',
    };
    assert.equal((await service.bookingSnapshot()).bookings.length, 0);
    await assert.rejects(
      async () => await service.createBooking({ ...input, amount: NaN }),
      /total/,
    );
    await assert.rejects(
      async () => await service.createBooking({ ...input, travelDate: '2027-02-30' }),
      /dates/,
    );
    await assert.rejects(
      async () => await service.createBooking({ ...input, returnDate: '2027-01-01' }),
      /dates/,
    );
    await assert.rejects(
      async () => await service.createBooking({ ...input, travelers: 0 }),
      /travellers/,
    );
    let snap = await service.createBooking(input);
    const id = snap.bookings[0].id;
    assert.equal(snap.bookings[0].status, 'Pending');
    assert.equal(snap.bookings[0].passengers, input.passengers);
    await service.updateBookingStatus(id, 'Confirmed');
    snap = await service.recordBookingPayment({
      bookingId: id,
      amount: 3000,
      method: 'UPI',
      reference: 'TEST-ADVANCE',
    });
    assert.equal(snap.bookings[0].paid, 3000);
    await assert.rejects(
      async () =>
        await service.recordBookingPayment({
          bookingId: id,
          amount: 8000,
          method: 'UPI',
          reference: 'TEST-OVERPAY',
        }),
      /remaining balance/,
    );
    assert.equal((await service.bookingSnapshot()).payments.length, 1);
    await assert.rejects(
      async () =>
        await service.recordBookingPayment({
          bookingId: id,
          amount: 1000,
          method: 'UPI',
          reference: 'TEST-ADVANCE',
        }),
      /already recorded/,
    );
    await service.recordBookingPayment({
      bookingId: id,
      amount: 7000,
      method: 'Bank transfer',
      reference: 'TEST-FINAL',
    });
    assert.equal((await service.bookingSnapshot()).bookings[0].paid, 10000);
    await service.updateBookingStatus(id, 'Cancelled');
    await assert.rejects(
      async () =>
        await service.recordBookingPayment({
          bookingId: id,
          amount: 1,
          method: 'UPI',
          reference: 'AFTER-CANCEL',
        }),
      /active booking/,
    );
    await assert.rejects(
      async () => await service.updateBookingStatus(id, 'Confirmed'),
      /cannot be reopened/,
    );
    assert.equal((await service.bookingSnapshot()).payments.length, 2);
    await service.createBooking({ ...input, quoteId: 'TEST-QUOTE' });
    await assert.rejects(
      async () => await service.createBooking({ ...input, quoteId: 'TEST-QUOTE' }),
      /already exists/,
    );
    const local = { ...input, id: 'LEGACY-BOOKING', status: 'Pending', paid: 4000 };
    await service.importLocalBookings([local], []);
    await service.importLocalBookings([local], []);
    snap = await service.bookingSnapshot();
    assert.equal(snap.bookings.filter((b) => b.id === local.id).length, 1);
    assert.equal(snap.bookings.find((b) => b.id === local.id).paid, 4000);
    await assert.rejects(
      async () =>
        await service.importLocalBookings([{ ...local, id: 'INVALID-IMPORT', paid: 20000 }], []),
      /balance/,
    );
    assert(!(await service.bookingSnapshot()).bookings.some((b) => b.id === 'INVALID-IMPORT'));
    await db().run(
      'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1)',
      'customer-test',
      'Customer Test',
      'account@example.test',
      'disabled',
      'customer',
    );
    const request = {
      packageSlug: 'bali-island-discovery',
      customer: 'Website Traveller',
      email: 'website@example.test',
      phone: '9000011111',
      travelDate: '2099-01-10',
      returnDate: '2099-01-16',
      travelers: 2,
      notes: 'Room preference',
    };
    const created = await service.createWebsiteBooking(
      request,
      'website-booking-test-12345',
      'customer-test',
    );
    assert.equal(
      (await service.createWebsiteBooking(request, 'website-booking-test-12345', 'customer-test'))
        .id,
      created.id,
    );
    let website = (await service.bookingSnapshot()).bookings.find((b) => b.id === created.id);
    assert.equal(website.amount, 0);
    assert.equal(website.pricingPending, true);
    assert.equal(website.source, 'Website');
    assert.equal(website.customerId, 'customer-test');
    assert.equal(website.email, 'account@example.test');
    assert.equal((await service.customerBookings('another-customer')).bookings.length, 0);
    assert.equal(website.tour, 'Bali Island Discovery');
    await assert.rejects(
      async () => await service.updateBookingStatus(created.id, 'Confirmed'),
      /Set the booking price/,
    );
    await assert.rejects(
      async () =>
        await service.createWebsiteBooking(
          { ...request, packageSlug: 'invalid' },
          'website-booking-test-23456',
          'customer-test',
        ),
      /available travel package/,
    );
    await assert.rejects(
      async () =>
        await service.createWebsiteBooking(
          { ...request, travelDate: '2020-01-01' },
          'website-booking-test-34567',
          'customer-test',
        ),
      /future departure/,
    );
    await service.setBookingPrice(created.id, 40000);
    await service.updateBookingStatus(created.id, 'Confirmed');
    website = (await service.bookingSnapshot()).bookings.find((b) => b.id === created.id);
    assert.equal(website.amount, 40000);
    assert.equal(website.pricingPending, false);
    assert.equal(website.status, 'Confirmed');
    await service.recordBookingPayment({
      bookingId: created.id,
      amount: 5000,
      method: 'UPI',
      reference: 'WEBSITE-ADVANCE',
    });
    await assert.rejects(
      async () => await service.setBookingPrice(created.id, 4000),
      /less than payments/,
    );
    console.log(
      'PASS: direct booking, dates and amounts, status changes, advances, final payments, overpayment/duplicate prevention, cancellations and idempotent legacy migration, website booking requests and Admin pricing/confirmation.',
    );
  } finally {
    await db().close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
