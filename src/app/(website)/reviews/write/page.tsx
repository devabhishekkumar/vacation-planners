import Link from 'next/link';
import { requireCustomer } from '@/lib/auth/customer-session';
import WriteReviewForm from '@/components/WriteReviewForm';
export default async function WriteReview() {
  const customer = await requireCustomer('/reviews/write');
  return (
    <section className="section section-warm">
      <div className="container write-review-layout">
        <div>
          <span className="eyebrow">TELL YOUR TRAVEL STORY</span>
          <h1>
            A journey worth <em>sharing.</em>
          </h1>
          <p>
            Your experiences help other travellers find their next adventure. Share the moments that
            made your trip memorable.
          </p>
          <Link href="/reviews" className="text-link">
            Back to customer reviews
          </Link>
        </div>
        <div className="form-shell">
          <WriteReviewForm name={customer.name} />
        </div>
      </div>
    </section>
  );
}
