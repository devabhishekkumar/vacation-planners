import Link from 'next/link';
import { Star, MessageSquareQuote, ArrowUpRight } from 'lucide-react';
import { reviews } from '@/lib/reviews';
import { addReview, publishReview } from './actions';
export const dynamic = 'force-dynamic';
export default async function ManageReviews({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const items = reviews(false),
    { message } = await searchParams;
  return (
    <div className="crm-workspace">
      <div className="crm-page-heading">
        <div>
          <span className="crm-overline">WEBSITE CONTENT</span>
          <h1>Customer reviews</h1>
          <p>
            Add genuine customer feedback and choose which stories appear on the website carousel.
          </p>
        </div>
        <Link className="crm-btn crm-btn-light" href="/reviews">
          View website <ArrowUpRight size={16} />
        </Link>
      </div>
      {message && (
        <p role="status" className="reviews-admin-notice">
          {message}
        </p>
      )}
      <div className="reviews-admin-layout">
        <section className="crm-panel">
          <div className="crm-panel-header">
            <div>
              <h2>Add a review</h2>
              <p>Only publish customer feedback you have permission to share.</p>
            </div>
          </div>
          <form action={addReview} className="reviews-admin-form">
            <label className="crm-form-field">
              <span>Customer name</span>
              <input name="name" minLength={2} maxLength={90} required />
            </label>
            <label className="crm-form-field">
              <span>Trip or destination (optional)</span>
              <input name="destination" maxLength={120} />
            </label>
            <label className="crm-form-field">
              <span>Rating</span>
              <select name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((r) => (
                  <option value={r} key={r}>
                    {r} out of 5
                  </option>
                ))}
              </select>
            </label>
            <label className="crm-form-field">
              <span>Customer review</span>
              <textarea name="body" rows={5} minLength={20} maxLength={1500} required />
            </label>
            <label className="reviews-admin-check">
              <input name="permission" type="checkbox" required /> I have permission to publish this
              customer's review.
            </label>
            <label className="reviews-admin-check">
              <input name="published" type="checkbox" /> Publish on the website now
            </label>
            <button className="crm-btn crm-btn-primary">Save review</button>
          </form>
        </section>
        <section className="crm-panel">
          <div className="crm-panel-header">
            <div>
              <h2>Review library</h2>
              <p>
                {items.filter((r) => r.published).length} published / {items.length} total
              </p>
            </div>
          </div>
          <div className="reviews-admin-library">
            {!items.length ? (
              <div className="crm-no-items">
                <MessageSquareQuote size={30} />
                <p>No reviews yet. Add your first customer story.</p>
              </div>
            ) : (
              items.map((r) => (
                <article key={r.id} className="reviews-admin-item">
                  <div className="reviews-admin-row">
                    <strong>{r.name}</strong>
                    <span className="crm-soft-label">{r.published ? 'PUBLISHED' : 'DRAFT'}</span>
                  </div>
                  <p>{r.destination}</p>
                  <div className="reviews-carousel-rating" aria-label={r.rating + ' out of 5'}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= r.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <blockquote>{r.body}</blockquote>
                  <form action={publishReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="published" value={String(!r.published)} />
                    <button className="crm-btn crm-btn-light">
                      {r.published ? 'Unpublish' : 'Publish'}
                    </button>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
