import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { travelOperator } from '@/lib/travel/operator';
import { sameOrigin, jsonBody, failure, privateHeaders } from '@/lib/travel/http';
import { TravelError } from '@/lib/travel/errors';
import { contentSnapshot, publishContent } from '@/lib/content/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (!(await travelOperator())) throw new TravelError('Operator sign-in required.', 401);
    return NextResponse.json(await contentSnapshot(), { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (!(await travelOperator())) throw new TravelError('Operator sign-in required.', 401);
    const body = await jsonBody(request);
    const result = await publishContent(body.revision, body.content);
    revalidatePath('/', 'layout');
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
