import { currentCustomer } from '@/lib/auth/customer-session';
import { customerNext } from '@/lib/auth/customer-account';
import { NextRequest, NextResponse } from 'next/server';
import { createWebsiteBooking } from '@/lib/booking-service';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const input = await request.json();
    const customer = await currentCustomer();
    if (!customer)
      return NextResponse.json(
        {
          error: 'Please sign in or create an account to continue booking.',
          loginUrl:
            '/login/customer?next=' +
            encodeURIComponent(customerNext('/book/' + String(input.packageSlug || ''))),
        },
        { status: 401 },
      );
    const result = createWebsiteBooking(
      {
        packageSlug: input.packageSlug,
        customer: input.customer,
        email: customer.email,
        phone: input.phone,
        travelDate: input.travelDate,
        returnDate: input.returnDate,
        travelers: Number(input.travelers),
        passengers: input.passengers,
        notes: input.notes,
      },
      request.headers.get('Idempotency-Key') || '',
      customer.id,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : 'Could not send your booking request. Please try again.',
      },
      { status: 400 },
    );
  }
}
