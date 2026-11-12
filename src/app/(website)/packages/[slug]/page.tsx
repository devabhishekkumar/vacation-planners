import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { getSiteContent } from '@/lib/content/service';
import EnquiryForm from '@/components/EnquiryForm';
import PackageCard from '@/components/PackageCard';
export async function generateStaticParams() {
  const { packages } = await getSiteContent();
  return packages.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { packages } = await getSiteContent();
  const getPackage = (slug: string) => packages.find((p) => p.slug === slug);
  const { slug } = await params;
  const p = getPackage(slug);
  return { title: p?.title ?? 'Package not found', description: p?.summary };
}
export default async function PackageDetails({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { packages } = await getSiteContent();
  const getPackage = (slug: string) => packages.find((p) => p.slug === slug);
  const { slug } = await params;
  const tour = getPackage(slug);
  if (!tour) notFound();
  const related = packages
    .filter((p) => p.slug !== slug && p.destinationSlug !== tour.destinationSlug)
    .slice(0, 3);
  return (
    <>
      <section className="detail-heading">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <Link href="/packages">Tour packages</Link>
            <ChevronRight size={14} />
            <span>{tour.title}</span>
          </div>
          <div className="detail-title-row">
            <div>
              <span className="eyebrow">YOUR NEXT ADVENTURE</span>
              <h1>{tour.title}</h1>
              <p>{tour.summary}</p>
            </div>
            <Link href="/packages" className="text-link back-link">
              <ArrowLeft size={17} /> All journeys
            </Link>
          </div>
          <div className="detail-facts">
            <span>
              <MapPin size={18} />
              {tour.country}
            </span>
            <span>
              <CalendarDays size={18} />
              {tour.duration}
            </span>
            <span>
              <Compass size={18} />
              {tour.type}
            </span>
          </div>
        </div>
      </section>
      <section className="container detail-image-grid">
        <div className="detail-image-main">
          <Image
            src={tour.images[0]}
            alt={`${tour.title} featured scenery`}
            priority
            fill
            sizes="(max-width:900px) 100vw, 65vw"
            className="image-cover"
          />
        </div>
        <div className="detail-image-side">
          <Image
            src={tour.images[1]}
            alt="Additional travel scenery"
            fill
            sizes="35vw"
            className="image-cover"
          />
        </div>
        <div className="detail-image-side">
          <Image
            src={tour.images[2]}
            alt="Additional destination scenery"
            fill
            sizes="35vw"
            className="image-cover"
          />
        </div>
      </section>
      <section className="section detail-body">
        <div className="container detail-columns">
          <div className="detail-content">
            <div className="detail-block">
              <span className="eyebrow">THE EXPERIENCE</span>
              <h2>
                Here&apos;s where the <em>story begins.</em>
              </h2>
              <p>
                {tour.summary} The trip outline below is an example of what your journey could look
                like. We can refine it to match your travel dates and needs.
              </p>
              <div className="highlight-grid">
                {tour.highlights.map((h) => (
                  <div key={h}>
                    <Check size={18} />
                    {h}
                  </div>
                ))}
              </div>
            </div>
            <div className="detail-block itinerary-section">
              <span className="eyebrow">DAY BY DAY</span>
              <h2>
                Your journey, <em>unfolded.</em>
              </h2>
              <p>
                Explore the flow of your possible trip. Activities and timings are subject to the
                final quotation.
              </p>
              <div className="itinerary-list">
                {tour.itinerary.map((item, i) => (
                  <details key={item.day} open={i === 0}>
                    <summary>
                      <span className="itinerary-day">DAY {String(item.day).padStart(2, '0')}</span>
                      <strong>{item.title}</strong>
                      <span className="itinerary-toggle">+</span>
                    </summary>
                    <p>{item.detail}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="detail-block">
              <span className="eyebrow">THE FINE DETAILS</span>
              <h2>
                What&apos;s included <em>and what&apos;s not.</em>
              </h2>
              <div className="includes-grid">
                <div>
                  <h3>
                    <Check size={20} /> Typical inclusions
                  </h3>
                  {tour.included.map((item) => (
                    <p key={item}>
                      <Check size={15} />
                      {item}
                    </p>
                  ))}
                </div>
                <div>
                  <h3>
                    <X size={20} /> Typically excluded
                  </h3>
                  {tour.excluded.map((item) => (
                    <p key={item}>
                      <X size={15} />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
              <p className="travel-notice">
                Important: Images, accommodation, activities and itinerary are illustrative.
                Availability, exact inclusions, terms, travel requirements and pricing must be
                confirmed in the final quotation.
              </p>
            </div>
          </div>
          <aside className="detail-sidebar">
            <div className="detail-booking-card">
              <span className="eyebrow">CREATE YOUR ESCAPE</span>
              <h3>Your dream trip, your way.</h3>
              <p>Request a personalised itinerary and quotation for this experience.</p>
              <div className="booking-point">
                <Clock size={18} /> Flexible travel dates
              </div>
              <div className="booking-point">
                <Users size={18} /> Customisable group size
              </div>
              <div className="booking-point">
                <Compass size={18} /> Tailored activities
              </div>
              <Link href={`/book/${tour.slug}`} className="btn btn-primary">
                Book now <ArrowUpRight size={18} />
              </Link>
              <Link
                href="#enquire"
                className="text-link"
                style={{ display: 'inline-flex', marginTop: 16 }}
              >
                Ask a question first
              </Link>
              <small>Request your dates. Our team confirms the final price and availability.</small>
            </div>
          </aside>
        </div>
      </section>
      <section id="book" className="section section-warm">
        <div className="container enquiry-section-layout">
          <div>
            <span className="eyebrow">YOUR NEXT JOURNEY</span>
            <h2>
              Book your <em>escape.</em>
            </h2>
            <p>
              Choose your dates and tell us who is travelling. Our team will confirm the details and
              help you plan the rest.
            </p>
            <div className="booking-point">
              <Check size={18} /> No payment required to send a request
            </div>
            <div className="booking-point">
              <Check size={18} /> Personal assistance from our travel team
            </div>
          </div>
          <div className="form-shell">
            <div className="website-booking-summary">
              <strong>{tour.title}</strong>
              <span>{tour.duration}</span>
              <p>
                Sign in or create an account to choose your dates and submit your booking request.
              </p>
              <Link className="btn btn-primary" href={`/book/${tour.slug}`}>
                Book now <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section id="enquire" className="section section-warm">
        <div className="container enquiry-section-layout">
          <div>
            <span className="eyebrow">LET&apos;S MAKE IT HAPPEN</span>
            <h2>
              Make this journey <em>your own.</em>
            </h2>
            <p>
              Share a few details and our team will contact you with a personalised itinerary and
              quotation.
            </p>
          </div>
          <div className="form-shell">
            <EnquiryForm packageName={tour.title} />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">KEEP EXPLORING</span>
              <h2 className="section-title">You may also love.</h2>
            </div>
          </div>
          <div className="packages-grid">
            {related.map((t) => (
              <PackageCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
