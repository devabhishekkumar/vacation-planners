import { NextRequest, NextResponse } from 'next/server';
import { currentCustomer } from '../auth/customer-session';
import { travelOperator } from './operator';
import { TravelError, type TravelActor } from './service';
export async function actor(): Promise<TravelActor> {
  if (await travelOperator()) return { admin: true };
  const customer = await currentCustomer();
  if (!customer) throw new TravelError('Please sign in to access travel details.', 401);
  return { admin: false, customerId: customer.id };
}
export function sameOrigin(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    throw new TravelError('Invalid request origin.', 403);
}
export function failure(error: unknown) {
  if (error instanceof TravelError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(
    'Travel management request failed',
    error instanceof Error ? error.message : 'Unknown error',
  );
  return NextResponse.json(
    { error: 'Could not complete the travel request. Please try again.' },
    { status: 500 },
  );
}
export async function limitedBody(request: NextRequest, max: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new TravelError('Request body required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const value = await reader.read();
      if (value.done) break;
      size += value.value.length;
      if (size > max) {
        await reader.cancel();
        throw new TravelError('Request is too large.', 413);
      }
      chunks.push(value.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function jsonBody(request: NextRequest) {
  try {
    const value = JSON.parse(new TextDecoder().decode(await limitedBody(request, 1024 * 1024)));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new TravelError('A JSON object is required.');
    return value;
  } catch (error) {
    if (error instanceof TravelError) throw error;
    throw new TravelError('Invalid JSON request.');
  }
}
export const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};
