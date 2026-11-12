import { randomUUID } from 'node:crypto';
import { db } from './auth/database';
export type Review = {
  id: string;
  name: string;
  destination: string;
  rating: number;
  body: string;
  published: boolean;
  createdAt: string;
};
function database() {
  return db();
}
export async function reviews(publishedOnly = true): Promise<Review[]> {
  return (
    await database().all(
      'SELECT id,name,destination,rating,body,published,created_at FROM website_reviews' +
        (publishedOnly ? ' WHERE published=1 AND permission=1' : '') +
        ' ORDER BY created_at DESC,insertion_order DESC',
    )
  ).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    destination: String(r.destination),
    rating: Number(r.rating),
    body: String(r.body),
    published: Boolean(r.published),
    createdAt: String(r.created_at),
  }));
}
export async function createReview(input: {
  name: unknown;
  destination: unknown;
  rating: unknown;
  body: unknown;
  permission: boolean;
  published: boolean;
}) {
  const name = String(input.name || '').trim(),
    destination = String(input.destination || '').trim(),
    body = String(input.body || '').trim(),
    rating = Number(input.rating);
  if (name.length < 2 || name.length > 90)
    throw Error('Enter a reviewer name of 2 to 90 characters.');
  if (destination.length > 120)
    throw Error('Trip or destination must have no more than 120 characters.');
  if (body.length < 20 || body.length > 1500)
    throw Error('Enter a review of 20 to 1500 characters.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw Error('Choose a rating from 1 to 5.');
  if (!input.permission) throw Error('Confirm permission to publish this customer review.');
  const id = randomUUID();
  await database().run(
    'INSERT INTO website_reviews(id,name,destination,rating,body,published,permission,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    id,
    name,
    destination,
    rating,
    body,
    input.published ? 1 : 0,
    1,
    new Date().toISOString(),
  );
  return id;
}
export async function setReviewPublished(id: string, published: boolean) {
  const result = await database().run(
    'UPDATE website_reviews SET published=$1 WHERE id=$2 AND permission=1',
    published ? 1 : 0,
    id,
  );
  if (!result.changes) throw Error('Review not found or publication permission missing.');
}
