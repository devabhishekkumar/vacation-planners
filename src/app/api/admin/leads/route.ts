import { NextRequest, NextResponse } from 'next/server';
import { allLeads, createLead, patchLead, importLocalLeads } from '@/lib/lead-service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({ leads: allLeads() }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const body = await request.json();
    if (body.operation === 'create') createLead(body.item);
    else if (body.operation === 'patch') patchLead(body.id, body.changes);
    else if (body.operation === 'import') importLocalLeads(body.leads);
    else return NextResponse.json({ error: 'Invalid operation.' }, { status: 400 });
    return NextResponse.json({ leads: allLeads() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not save enquiry.' },
      { status: 400 },
    );
  }
}
