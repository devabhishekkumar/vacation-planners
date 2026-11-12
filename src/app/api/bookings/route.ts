import { NextRequest, NextResponse } from 'next/server';
import {
  bookingSnapshot,
  setBookingPrice,
  createBooking,
  updateBookingStatus,
  recordBookingPayment,
  importLocalBookings,
} from '@/lib/booking-service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json(bookingSnapshot(), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const body = await request.json();
    const snapshot =
      body.operation === 'price'
        ? setBookingPrice(body.id, Number(body.amount))
        : body.operation === 'create'
          ? createBooking(body.item)
          : body.operation === 'status'
            ? updateBookingStatus(body.id, body.status)
            : body.operation === 'payment'
              ? recordBookingPayment(body.item)
              : body.operation === 'import'
                ? importLocalBookings(body.bookings, body.payments)
                : null;
    if (!snapshot)
      return NextResponse.json({ error: 'Unknown booking operation.' }, { status: 400 });
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not save booking.' },
      { status: 400 },
    );
  }
}
