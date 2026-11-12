/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS integration test. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  Module = require('node:module'),
  ts = require('typescript');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vp-travel-test-'));
process.env.AUTH_DATA_DIR = directory;
Module._extensions['.ts'] = (m, p) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(p, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    p,
  );
const { db } = require('../src/lib/auth/database.ts'),
  bookings = require('../src/lib/booking-service.ts'),
  travel = require('../src/lib/travel/service.ts'),
  { itineraryPdf } = require('../src/lib/travel/pdf.ts');
const admin = { admin: true },
  customer = { admin: false, customerId: 'customer-one' },
  other = { admin: false, customerId: 'customer-two' };
try {
  for (const id of ['customer-one', 'customer-two'])
    db()
      .prepare('INSERT INTO users VALUES(?,?,?,?,?,1)')
      .run(id, id, id + '@example.test', 'disabled', 'customer');
  const booking = bookings.createBooking({
    customer: 'Traveller',
    customerId: 'customer-one',
    email: 'customer-one@example.test',
    tour: 'Goa holiday',
    travelDate: '2099-01-01',
    returnDate: '2099-01-07',
    travelers: 2,
    amount: 5000,
  }).bookings[0];
  let state = travel.travelSnapshot(booking.id, admin);
  const mutate = (body) => {
    state = travel.mutateTravel(booking.id, admin, { revision: state.revision, ...body });
    return state;
  };
  assert.throws(() => travel.travelSnapshot(booking.id, other), /not found/);
  assert.throws(() => travel.mutateTravel(booking.id, customer, { revision: 0 }), /sign-in/);
  mutate({
    operation: 'service-save',
    kind: 'hotel',
    status: 'Pending',
    fields: { name: 'Beach Hotel' },
  });
  const hotel = state.services[0].id;
  const originalRevision = state.revision;
  assert.throws(() => mutate({ operation: 'service-confirm', id: hotel }), /required/);
  assert.equal(travel.travelSnapshot(booking.id, admin).revision, originalRevision);
  const fields = {
    name: 'Beach Hotel',
    address: 'Goa',
    contact: '+91 90000 11111',
    room: 'Deluxe',
    checkin: '2099-01-01',
    checkout: '2099-01-05',
    confirmation: 'HT-1',
  };
  mutate({ operation: 'service-save', id: hotel, kind: 'hotel', status: 'Changed', fields });
  assert.throws(
    () =>
      travel.uploadTravelDocument(
        booking.id,
        admin,
        hotel,
        state.revision,
        'bad.pdf',
        'application/pdf',
        Buffer.from('<html>bad</html>'),
      ),
    /contents/,
  );
  state = travel.uploadTravelDocument(
    booking.id,
    admin,
    hotel,
    state.revision,
    'voucher.pdf',
    'application/pdf',
    Buffer.from('%PDF-1.4\nfixture'),
  );
  const documentId = state.documents[0].id;
  assert.equal(travel.travelSnapshot(booking.id, customer).documents.length, 0);
  assert.throws(() => travel.downloadTravelDocument(documentId, customer), /not confirmed/);
  mutate({ operation: 'service-confirm', id: hotel });
  assert.equal(travel.travelSnapshot(booking.id, customer).documents.length, 1);
  assert.equal(travel.downloadTravelDocument(documentId, customer).name, 'voucher.pdf');
  assert.throws(() => travel.downloadTravelDocument(documentId, other), /not found/);
  assert.throws(
    () =>
      travel.mutateTravel(booking.id, admin, {
        revision: 0,
        operation: 'service-delete',
        id: hotel,
      }),
    /changed elsewhere/,
  );
  const activity = {
    id: 'arrival',
    day: 1,
    time: '09:00',
    title: 'Arrival',
    location: 'Airport',
    notes: 'Meet your driver',
    status: 'Pending',
  };
  mutate({ operation: 'itinerary-save', itinerary: [activity] });
  assert.equal(travel.travelSnapshot(booking.id, customer).itinerary.length, 0);
  mutate({ operation: 'itinerary-publish', itinerary: [activity] });
  assert.equal(travel.travelSnapshot(booking.id, customer).itinerary[0].title, 'Arrival');
  mutate({ operation: 'itinerary-save', itinerary: [{ ...activity, title: 'Private new draft' }] });
  assert.equal(travel.travelSnapshot(booking.id, customer).itinerary[0].title, 'Arrival');
  assert.equal(travel.travelSnapshot(booking.id, admin, true).itinerary[0].title, 'Arrival');
  const pdf = Buffer.from(itineraryPdf(travel.travelSnapshot(booking.id, customer))).toString();
  assert.ok(pdf.startsWith('%PDF-'));
  assert.ok(!pdf.includes('Private new draft'));
  assert.ok(pdf.includes('Pending'));
  mutate({
    operation: 'service-save',
    kind: 'taxi',
    status: 'Pending',
    fields: { pickup: 'Airport', drop: 'Hotel' },
  });
  assert.equal(state.services.length, 2);
  assert.throws(
    () => mutate({ operation: 'service-save', kind: 'hotel', status: 'Confirmed', fields }),
    /Use Confirm/,
  );
  assert.throws(
    () =>
      mutate({
        operation: 'service-save',
        kind: 'hotel',
        status: 'Pending',
        fields: { ...fields, checkout: '2099-01-01' },
      }),
    /Check-out/,
  );
  mutate({
    operation: 'coordinator',
    coordinator: { name: 'Coordinator', phone: '+91 90000 22222', email: 'support@example.test' },
  });
  assert.equal(travel.travelSnapshot(booking.id, customer).coordinator.name, 'Coordinator');
  assert.ok(travel.travelSnapshot(booking.id, customer).notifications.some((n) => !n.read));
  travel.readTravelNotices(booking.id, customer);
  assert.ok(travel.travelSnapshot(booking.id, customer).notifications.every((n) => n.read));
  state = travel.uploadTravelDocument(
    booking.id,
    admin,
    hotel,
    state.revision,
    'updated.pdf',
    'application/pdf',
    Buffer.from('%PDF-1.4\nupdated'),
  );
  assert.equal(state.services.find((s) => s.id === hotel).status, 'Changed');
  assert.equal(travel.travelSnapshot(booking.id, customer).documents.length, 0);
  mutate({ operation: 'service-delete', id: hotel });
  assert.throws(() => travel.downloadTravelDocument(documentId, admin), /not found/);

  for (const [kind, fields] of [
    [
      'transport',
      {
        mode: 'Flight',
        carrier: 'Test Air',
        number: 'TA123',
        from: 'Delhi',
        to: 'Goa',
        date: '2099-01-01',
        departure: '09:00',
        arrivalDate: '2099-01-01',
        arrival: '11:00',
        pnr: 'PNR123',
      },
    ],
    [
      'taxi',
      {
        pickup: 'Airport',
        drop: 'Hotel',
        date: '2099-01-01',
        time: '12:00',
        driver: 'Assigned Driver',
        phone: '+91 90000 11111',
        vehicle: 'Sedan AB12CD1234',
      },
    ],
    [
      'food',
      {
        meal: 'Breakfast',
        restaurant: 'Hotel restaurant',
        date: '2099-01-02',
        time: '08:00',
        plan: 'Vegetarian breakfast',
      },
    ],
    ['sightseeing', { name: 'City tour', location: 'Old Goa', date: '2099-01-02', time: '10:00' }],
  ]) {
    mutate({ operation: 'service-save', kind, status: 'Pending', fields });
    const added = state.services.at(-1);
    mutate({ operation: 'service-confirm', id: added.id });
    assert.equal(state.services.find((item) => item.id === added.id).status, 'Confirmed');
  }
  const otherBooking = bookings.createBooking({
    customer: 'Other traveller',
    customerId: 'customer-two',
    tour: 'Another trip',
    travelDate: '2099-02-01',
    travelers: 1,
    amount: 2000,
  }).bookings[0];
  const otherState = travel.travelSnapshot(otherBooking.id, admin);
  assert.throws(
    () =>
      travel.mutateTravel(otherBooking.id, admin, {
        operation: 'service-save',
        revision: otherState.revision,
        id: state.services.at(-1).id,
        kind: 'sightseeing',
        status: 'Changed',
        fields: { name: 'Unauthorized move', location: 'Goa' },
      }),
    /not found/,
  );
  bookings.updateBookingStatus(booking.id, 'Cancelled');
  assert.throws(() => mutate({ operation: 'coordinator', coordinator: {} }), /read-only/);
  console.log(
    'Travel management integration checks passed: ownership, permissions, confirmation, uploads, document access, conflict rollback, draft/publish isolation, PDF, notifications, cascade deletion and cancelled bookings.',
  );
} finally {
  db().close();
  fs.rmSync(directory, { recursive: true, force: true });
}
