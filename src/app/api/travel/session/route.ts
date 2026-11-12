import { NextRequest, NextResponse } from 'next/server';
import { loginTravelOperator, logoutTravelOperator, travelOperator } from '@/lib/travel/operator';
import { sameOrigin, jsonBody, failure, privateHeaders } from '@/lib/travel/http';
import { TravelError } from '@/lib/travel/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(
    {
      authenticated: Boolean(await travelOperator()),
      configured: Boolean(
        process.env.TRAVEL_ADMIN_KEY && process.env.TRAVEL_ADMIN_KEY.length >= 24,
      ),
    },
    { headers: privateHeaders },
  );
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    try {
      await loginTravelOperator(body.key);
    } catch (error) {
      throw new TravelError(error instanceof Error ? error.message : 'Sign-in failed.', 401);
    }
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    await logoutTravelOperator();
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
