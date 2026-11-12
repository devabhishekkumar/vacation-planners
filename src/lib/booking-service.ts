import { randomUUID } from 'node:crypto';
import { db } from './auth/database';
import { getPublishedPackage as getPackage } from './content/service';
import type { Booking, BookingStatus, Payment } from '../features/crm/demo-data';
const statuses: BookingStatus[] = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
function database() {
  return db();
}
const text = (value: unknown, max = 200) =>
  String(value ?? '')
    .trim()
    .slice(0, max);
function validate(input: Partial<Booking>, allowPendingPricing = false): Booking {
  const customer = text(input.customer, 90),
    tour = text(input.tour, 120),
    travelDate = text(input.travelDate, 10),
    returnDate = text(input.returnDate, 10);
  if (!customer || !tour) throw Error('Enter the customer and journey name.');
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s + 'T12:00:00Z')) &&
    new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
  if (!validDate(travelDate) || (returnDate && (!validDate(returnDate) || returnDate < travelDate)))
    throw Error('Choose valid travel dates; return must be on or after departure.');
  const amount = Number(input.amount),
    travelers = Number(input.travelers);
  if (
    !Number.isSafeInteger(amount) ||
    (allowPendingPricing ? amount < 0 : amount <= 0) ||
    amount > 100000000
  )
    throw Error('Enter a booking total from INR 1 to 100,000,000 in whole rupees.');
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 50)
    throw Error('Enter between 1 and 50 travellers.');
  const email = text(input.email, 254);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw Error('Enter a valid customer email.');
  return {
    id: 'BK-' + randomUUID().slice(0, 8).toUpperCase(),
    customer,
    tour,
    travelDate,
    travelers,
    amount,
    paid: 0,
    status: 'Pending',
    quoteId: text(input.quoteId, 100),
    customerId: text(input.customerId, 100) || undefined,
    pricingPending: allowPendingPricing && amount === 0,
    source: text(input.source, 40) || 'Admin',
    packageSlug: text(input.packageSlug, 100),
    email,
    phone: text(input.phone, 28),
    returnDate,
    passengers: text(input.passengers, 3000),
    notes: text(input.notes, 3000),
  };
}
export async function bookingSnapshot() {
  const d = database();
  // Both collections come from one PostgreSQL statement snapshot.
  const rows = await d.all(
    "SELECT 'payment' AS collection,payload,insertion_order FROM booking_payments UNION ALL SELECT 'booking' AS collection,payload,insertion_order FROM travel_bookings ORDER BY insertion_order DESC",
  );
  const payments = rows
    .filter((row) => row.collection === 'payment')
    .map((row) => JSON.parse(row.payload as string) as Payment);
  const bookings = rows
    .filter((row) => row.collection === 'booking')
    .map((row) => {
      const b = JSON.parse(row.payload as string) as Booking;
      return {
        ...b,
        paid: payments.filter((p) => p.bookingId === b.id).reduce((sum, p) => sum + p.amount, 0),
      };
    });
  return { bookings, payments };
}
export async function createBooking(input: Partial<Booking>) {
  const d = database(),
    booking = validate(input);
  if (
    booking.quoteId &&
    (await d.get('SELECT id FROM travel_bookings WHERE quote_id=$1', booking.quoteId))
  )
    throw Error('A booking already exists for this quotation.');
  await d.run(
    'INSERT INTO travel_bookings(id,quote_id,payload) VALUES($1,$2,$3)',
    booking.id,
    booking.quoteId,
    JSON.stringify(booking),
  );
  return await bookingSnapshot();
}
export async function updateBookingStatus(id: string, status: BookingStatus) {
  return database().transaction(async () => {
    if (!statuses.includes(status)) throw Error('Invalid booking status.');
    const d = database();
    const row = await d.get('SELECT payload FROM travel_bookings WHERE id=$1', id);
    if (!row) throw Error('Booking not found.');
    const booking = JSON.parse(row.payload as string) as Booking;
    if (booking.pricingPending && ['Confirmed', 'Completed'].includes(status))
      throw Error('Set the booking price before confirming this request.');
    if (booking.status === 'Cancelled' && status !== 'Cancelled')
      throw Error('Cancelled bookings cannot be reopened. Create a new booking.');
    await d.run(
      'UPDATE travel_bookings SET payload=$1 WHERE id=$2',
      JSON.stringify({ ...booking, status }),
      id,
    );
    return await bookingSnapshot();
  });
}
export async function recordBookingPayment(input: Partial<Payment>) {
  const d = database();
  return await d.transaction(async () => {
    const snapshot = await bookingSnapshot(),
      booking = snapshot.bookings.find((b) => b.id === input.bookingId);
    if (!booking || booking.status === 'Cancelled') throw Error('Choose an active booking.');
    const amount = Number(input.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > booking.amount - booking.paid)
      throw Error('Payment must be positive and no greater than the remaining balance.');
    const reference = text(input.reference, 90),
      method = text(input.method, 40);
    if (!reference || !method) throw Error('Enter a payment method and transaction reference.');
    if (snapshot.payments.some((p) => p.bookingId === booking.id && p.reference === reference))
      throw Error('This transaction reference is already recorded for the booking.');
    const payment: Payment = {
      id: 'PM-' + randomUUID().slice(0, 8).toUpperCase(),
      bookingId: booking.id,
      customer: booking.customer,
      amount,
      reference,
      method,
      date: new Date().toISOString().slice(0, 10),
    };
    await d.run(
      'INSERT INTO booking_payments(id,booking_id,payload) VALUES($1,$2,$3)',
      payment.id,
      payment.bookingId,
      JSON.stringify(payment),
    );
    return await bookingSnapshot();
  });
}
/** Preserve local bookings from the previous browser-only workspace. */
export async function importLocalBookings(bookings: Booking[], payments: Payment[]) {
  const d = database();
  if (
    !Array.isArray(bookings) ||
    !Array.isArray(payments) ||
    bookings.length > 1000 ||
    payments.length > 5000
  )
    throw Error('Invalid local booking import.');
  return await d.transaction(async () => {
    for (const old of bookings) {
      if (await d.get('SELECT id FROM travel_bookings WHERE id=$1', old.id)) continue;
      const valid = validate(old, old.pricingPending === true && old.amount === 0);
      if (
        old.quoteId &&
        (await d.get('SELECT id FROM travel_bookings WHERE quote_id=$1', old.quoteId))
      )
        continue;
      const booking = {
        ...valid,
        id: text(old.id, 100),
        status: statuses.includes(old.status) ? old.status : 'Pending',
      };
      if (!booking.id) throw Error('Invalid booking reference.');
      await d.run(
        'INSERT INTO travel_bookings(id,quote_id,payload) VALUES($1,$2,$3)',
        booking.id,
        booking.quoteId,
        JSON.stringify(booking),
      );
      let importedPaid = 0;
      for (const oldPayment of payments.filter((p) => p.bookingId === old.id)) {
        const amount = Number(oldPayment.amount);
        if (!Number.isSafeInteger(amount) || amount <= 0 || importedPaid + amount > booking.amount)
          throw Error('Invalid local payment balance.');
        const payment = {
          ...oldPayment,
          id: text(oldPayment.id, 100),
          bookingId: booking.id,
          customer: booking.customer,
        };
        if (!payment.id) throw Error('Invalid payment reference.');
        await d.run(
          'INSERT INTO booking_payments(id,booking_id,payload) VALUES($1,$2,$3)',
          payment.id,
          booking.id,
          JSON.stringify(payment),
        );
        importedPaid += amount;
      }
      const previousPaid = Number(old.paid);
      if (
        !Number.isSafeInteger(previousPaid) ||
        previousPaid < importedPaid ||
        previousPaid > booking.amount
      )
        throw Error('Invalid local booking balance.');
      if (previousPaid > importedPaid) {
        const payment: Payment = {
          id: 'PM-' + randomUUID(),
          bookingId: booking.id,
          customer: booking.customer,
          amount: previousPaid - importedPaid,
          method: 'Opening balance',
          date: old.travelDate,
          reference: 'Imported browser balance',
        };
        await d.run(
          'INSERT INTO booking_payments(id,booking_id,payload) VALUES($1,$2,$3)',
          payment.id,
          booking.id,
          JSON.stringify(payment),
        );
      }
    }
    return await bookingSnapshot();
  });
}
export async function setBookingPrice(id: string, amount: number) {
  const d = database();
  return await d.transaction(async () => {
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000000)
      throw Error('Enter a total from INR 1 to 100,000,000 in whole rupees.');
    const booking = (await bookingSnapshot()).bookings.find((b) => b.id === id);
    if (!booking || booking.status === 'Cancelled') throw Error('Choose an active booking.');
    if (amount < booking.paid)
      throw Error('Booking total cannot be less than payments already recorded.');
    await d.run(
      'UPDATE travel_bookings SET payload=$1 WHERE id=$2',
      JSON.stringify({ ...booking, amount, pricingPending: false }),
      id,
    );
    return await bookingSnapshot();
  });
}
export async function createWebsiteBooking(
  input: {
    packageSlug: string;
    customer: string;
    email: string;
    phone: string;
    travelDate: string;
    returnDate?: string;
    travelers: number;
    passengers?: string;
    notes?: string;
  },
  requestKey: string,
  customerId: string,
) {
  if (!customerId) throw Error('Please sign in to book this package.');
  const account = (await db().get(
    "SELECT id,email FROM users WHERE id=$1 AND role='customer' AND active=1",
    customerId,
  )) as
    | {
        id: string;
        email: string;
      }
    | undefined;
  if (!account) throw Error('Please sign in to book this package.');
  const tour = await getPackage(input.packageSlug);
  if (!tour) throw Error('Select an available travel package.');
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(requestKey))
    throw Error('Invalid booking request reference. Please reload and try again.');
  if (String(input.customer || '').trim().length < 2) throw Error('Enter your full name.');
  if (!input.email || !input.phone || String(input.phone).replace(/\D/g, '').length < 7)
    throw Error('Enter a valid email and phone number.');
  const booking = validate(
    {
      ...input,
      email: account.email,
      customerId: account.id,
      tour: tour.title,
      amount: 0,
      quoteId: '',
      source: 'Website',
      packageSlug: tour.slug,
    },
    true,
  );
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  if (booking.travelDate < today) throw Error('Choose today or a future departure date.');
  const d = database();
  return await d.transaction(async () => {
    const existing = await d.get(
      'SELECT booking_id FROM website_booking_requests WHERE request_key=$1',
      requestKey,
    );
    if (existing) {
      const row = await d.get(
        'SELECT payload FROM travel_bookings WHERE id=$1',
        existing.booking_id as string,
      );
      const previous = JSON.parse(row!.payload as string) as Booking;
      if (previous.customerId !== account.id)
        throw Error('This request reference belongs to another account.');
      return { id: existing.booking_id as string, status: previous.status };
    }
    await d.run(
      'INSERT INTO travel_bookings(id,quote_id,payload) VALUES($1,$2,$3)',
      booking.id,
      '',
      JSON.stringify(booking),
    );
    await d.run(
      'INSERT INTO website_booking_requests(request_key,booking_id) VALUES($1,$2)',
      requestKey,
      booking.id,
    );
    return { id: booking.id, status: booking.status };
  });
}
export async function customerBookings(customerId: string) {
  const snapshot = await bookingSnapshot();
  const bookings = snapshot.bookings.filter((b) => b.customerId === customerId);
  const ids = new Set(bookings.map((b) => b.id));
  return { bookings, payments: snapshot.payments.filter((p) => ids.has(p.bookingId)) };
}
