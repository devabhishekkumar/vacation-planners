import { NextRequest, NextResponse } from 'next/server';
import { customerNext, loginCustomer, signupCustomer } from '@/lib/auth/customer-account';
import { startCustomerSession } from '@/lib/auth/customer-session';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const body = await request.json();
    if (!['login', 'signup'].includes(body.operation))
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    const user =
      body.operation === 'signup' ? await signupCustomer(body) : await loginCustomer(body);
    await startCustomerSession(user);
    return NextResponse.json({ next: customerNext(body.next) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign in. Please try again.' },
      { status: 400 },
    );
  }
}
