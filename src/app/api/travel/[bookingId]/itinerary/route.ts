import { NextRequest } from 'next/server';
import { actor, failure, privateHeaders } from '@/lib/travel/http';
import { travelSnapshot, TravelError } from '@/lib/travel/service';
import { itineraryPdf } from '@/lib/travel/pdf';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      bookingId: string;
    }>;
  },
) {
  try {
    const user = await actor();
    const trip = await travelSnapshot((await params).bookingId, user);
    if (!trip.publishedAt) throw new TravelError('The itinerary has not been published.', 404);
    const published = await travelSnapshot(trip.booking.id, user, true);
    const bytes = itineraryPdf(published);
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        ...privateHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="itinerary-${trip.booking.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
