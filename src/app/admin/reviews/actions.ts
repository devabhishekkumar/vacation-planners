'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createReview, setReviewPublished } from '@/lib/reviews';
export async function addReview(f: FormData) {
  try {
    createReview({
      name: f.get('name'),
      destination: f.get('destination'),
      rating: f.get('rating'),
      body: f.get('body'),
      permission: f.get('permission') === 'on',
      published: f.get('published') === 'on',
    });
  } catch (e) {
    redirect(
      '/admin/reviews?message=' +
        encodeURIComponent(e instanceof Error ? e.message : 'Could not save review.'),
    );
  }
  revalidatePath('/admin/reviews');
  redirect('/admin/reviews?message=Review+saved.');
}
export async function publishReview(f: FormData) {
  try {
    setReviewPublished(String(f.get('id') || ''), f.get('published') === 'true');
  } catch (e) {
    redirect(
      '/admin/reviews?message=' +
        encodeURIComponent(e instanceof Error ? e.message : 'Could not update review.'),
    );
  }
  revalidatePath('/admin/reviews');
}
