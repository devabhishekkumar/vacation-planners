import { NextRequest } from 'next/server';
import { actor, failure, privateHeaders } from '@/lib/travel/http';
import { downloadTravelDocument } from '@/lib/travel/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const file = downloadTravelDocument((await params).documentId, await actor());
    return new Response(new Uint8Array(file.bytes).buffer as ArrayBuffer, {
      headers: {
        ...privateHeaders,
        'Content-Type': file.mime,
        'Content-Disposition': `attachment; filename="${file.name.replace(/[^a-zA-Z0-9._ -]/g, '_')}"`,
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
