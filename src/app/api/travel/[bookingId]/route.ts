import { NextRequest, NextResponse } from 'next/server';
import {
  actor,
  sameOrigin,
  failure,
  privateHeaders,
  limitedBody,
  jsonBody,
} from '@/lib/travel/http';
import {
  travelSnapshot,
  mutateTravel,
  uploadTravelDocument,
  readTravelNotices,
  TravelError,
} from '@/lib/travel/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ bookingId: string }> };
export async function GET(_request: NextRequest, context: Context) {
  try {
    return NextResponse.json(travelSnapshot((await context.params).bookingId, await actor()), {
      headers: privateHeaders,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const user = await actor(),
      id = (await context.params).bookingId;
    if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      if (!user.admin) throw new TravelError('Operator sign-in required.', 403);
      const bytes = await limitedBody(request, 9 * 1024 * 1024);
      const form = await new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': request.headers.get('content-type')! },
        body: bytes.buffer as ArrayBuffer,
      }).formData();
      const file = form.get('file');
      if (!(file instanceof File)) throw new TravelError('Choose a document.');
      return NextResponse.json(
        uploadTravelDocument(
          id,
          user,
          String(form.get('serviceId') || ''),
          Number(form.get('revision')),
          file.name,
          file.type,
          new Uint8Array(await file.arrayBuffer()),
        ),
        { headers: privateHeaders },
      );
    }
    const body = await jsonBody(request);
    if (body.operation === 'notices-read') {
      readTravelNotices(id, user);
      return NextResponse.json(travelSnapshot(id, user), { headers: privateHeaders });
    }
    return NextResponse.json(mutateTravel(id, user, body), { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
