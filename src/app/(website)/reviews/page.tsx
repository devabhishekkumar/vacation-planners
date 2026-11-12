import Link from 'next/link';
import type { Metadata } from 'next';
import { Heart, MessageSquareQuote, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/PageHero';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import { getSiteContent } from '@/lib/content/service';
export const metadata: Metadata = {
  title: 'Customer Stories & Reviews',
  description: 'Travel reviews and guest stories from Vacation Planners.',
};
export default async function ReviewsPage() {
  const { photos } = await getSiteContent();
  return (
    <>
      <PageHero
        eyebrow="THE STORIES THAT STAY"
        title="A journey is better shared."
        description="The most meaningful recommendation comes from someone who's been there."
        image={photos.beach}
        crumb="Customer reviews"
      />
      <section className="section">
        <div className="container">
          <div className="review-page-intro">
            <span className="eyebrow">THE GOOD WORD</span>
            <h2>
              Real journeys. <em>Real voices.</em>
            </h2>
            <p>Explore the moments and memories our travellers have chosen to share.</p>
            <Link href="/reviews/write" className="btn btn-primary">
              Write a review
            </Link>
          </div>
          <ReviewsCarousel />
          <div className="review-principles">
            <div>
              <ShieldCheck size={23} />
              <span>Genuine customer stories</span>
            </div>
            <div>
              <Heart size={23} />
              <span>Shared with permission</span>
            </div>
            <div>
              <MessageSquareQuote size={23} />
              <span>Feedback that matters</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
