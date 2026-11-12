import { NextRequest, NextResponse } from 'next/server';
import { reviews, createReview } from '@/lib/reviews';
import { currentCustomer } from '@/lib/auth/customer-session';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(
    { reviews: await reviews() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await currentCustomer();
  if (!user)
    return NextResponse.json(
      { error: 'Please sign in before submitting a review.' },
      { status: 401 },
    );
  try {
    const input = await request.json();
    const id = await createReview({
      name: user.name,
      destination: input.destination,
      rating: input.rating,
      body: input.body,
      permission: input.permission === true,
      published: false,
    });
    return NextResponse.json({ id, status: 'pending' }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not submit review.' },
      { status: 400 },
    );
  }
}
