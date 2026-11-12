import { NextResponse } from 'next/server';
import { currentCustomer } from '@/lib/auth/customer-session';
export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await currentCustomer();
  return NextResponse.json(
    { user: user ? { name: user.name, email: user.email } : null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
