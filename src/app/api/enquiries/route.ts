import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/lib/lead-service';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const input = await request.json();
    const id = createLead(
      {
        name: input.name,
        email: input.email,
        phone: input.phone,
        destination: input.destination,
        travelDate: input.date,
        travelers: Number(input.travellers),
        notes: [
          input.packageName ? 'Package: ' + String(input.packageName).slice(0, 120) : '',
          String(input.message || '').slice(0, 2000),
        ]
          .filter(Boolean)
          .join('\n'),
        source: 'Website',
        priority: 'Medium',
      },
      request.headers.get('Idempotency-Key') || undefined,
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not submit enquiry. Please try again.' },
      { status: 400 },
    );
  }
}
