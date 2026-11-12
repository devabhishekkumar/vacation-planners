import { NextRequest, NextResponse } from 'next/server';
import { currentCustomer } from '@/lib/auth/customer-session';
import { customerProfile, saveCustomerProfile } from '@/lib/auth/customer-profile';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await currentCustomer();
  if (!user)
    return NextResponse.json({ error: 'Please sign in to view your profile.' }, { status: 401 });
  return NextResponse.json(await customerProfile(user.id), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await currentCustomer();
  if (!user)
    return NextResponse.json(
      { error: 'Please sign in again to update your profile.' },
      { status: 401 },
    );
  try {
    const input = await request.json();
    if (!input || typeof input !== 'object') throw Error('Invalid profile details.');
    return NextResponse.json(await saveCustomerProfile(user.id, input), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not save profile.' },
      { status: 400 },
    );
  }
}
