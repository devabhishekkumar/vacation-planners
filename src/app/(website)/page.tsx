import ReviewsCarousel from '@/components/ReviewsCarousel';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck2,
  Compass,
  HeartHandshake,
  MapPin,
  MessageCircle,
  MoveUpRight,
  Sparkles,
  Star,
  Waves,
} from 'lucide-react';
import { getSiteContent } from '@/lib/content/service';
import DestinationCard from '@/components/DestinationCard';
import PackageCard from '@/components/PackageCard';
import SectionIntro from '@/components/SectionIntro';
import SearchPanel from '@/components/SearchPanel';
import Reveal from '@/components/Reveal';
import { getWhatsappUrl } from '@/lib/utils';
export default function HomePage() {
  const { destinations, galleryItems, packages, photos } = getSiteContent();

  const whatsapp = getWhatsappUrl('Hello Vacation Planners! I would like to plan my trip.');
  return (
    <>
      <section className="hero">
        <Image
          src={photos.hero}
          alt="Golden travel landscape with mountains and a winding road"
          priority
          fill
          sizes="100vw"
          className="image-cover"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="hero-kicker">
            <span className="tiny-star">✳</span> YOUR WORLD, YOUR WAY
          </span>
          <h1>
            Go where you feel <em>most alive.</em>
          </h1>
          <p>
            Escape the ordinary. Discover remarkable places and beautiful moments with holidays
            thoughtfully planned around you.
          </p>
          <div className="hero-buttons">
            <a
              href={whatsapp ?? '/contact'}
              className="btn btn-primary btn-large"
              target={whatsapp ? '_blank' : undefined}
              rel={whatsapp ? 'noopener noreferrer' : undefined}
            >
              WhatsApp <MessageCircle size={19} />
            </a>
            <Link href="/contact" className="hero-learn">
              Plan your trip{' '}
              <span>
                <ArrowRight size={17} />
              </span>
            </Link>
          </div>
          <div className="hero-bottom-note">
            <span className="note-line" />
            <span>THE WORLD IS WAITING. LET'S EXPLORE.</span>
          </div>
        </div>
        <span className="hero-side-label">EXPLORE · DISCOVER · FEEL ALIVE</span>
      </section>
      <div className="container search-container">
        <SearchPanel destinations={destinations} />
      </div>
      <section className="promise-row">
        <div className="container promise-row-inner">
          <div>
            <Compass size={22} />
            <span>Journeys tailored to you</span>
          </div>
          <i />
          <div>
            <HeartHandshake size={22} />
            <span>Thoughtful travel planning</span>
          </div>
          <i />
          <div>
            <Sparkles size={22} />
            <span>Memories that last</span>
          </div>
        </div>
      </section>
      <section className="section destinations-section">
        <div className="container">
          <Reveal>
            <SectionIntro
              eyebrow="WISH YOU WERE HERE"
              title="A world of places to fall in love with."
              description="Dreamy coastlines, mountain hideaways and fascinating cities. Find the destination that speaks to you."
              linkLabel="All destinations"
              href="/destinations"
            />
          </Reveal>
          <div className="destinations-grid">
            {destinations
              .filter((d) => d.featured)
              .map((d, i) => (
                <Reveal key={d.slug} delay={i * 0.065}>
                  <DestinationCard destination={d} index={i} />
                </Reveal>
              ))}
          </div>
        </div>
      </section>
      <section className="section section-warm">
        <div className="container">
          <Reveal>
            <SectionIntro
              eyebrow="CURATED JOURNEYS"
              title="The kind of trips you'll talk about forever."
              description="Every traveller is different. Browse travel ideas and let us shape the details around you."
              href="/packages"
              linkLabel="Browse all trips"
            />
          </Reveal>
          <div className="packages-grid">
            {packages.slice(0, 3).map((tour, i) => (
              <Reveal key={tour.slug} delay={i * 0.08}>
                <PackageCard tour={tour} />
              </Reveal>
            ))}
          </div>
          <div className="section-footnote">
            <span>All itineraries shown are sample travel ideas and can be customised.</span>
            <Link href="/contact">
              Ask for a custom itinerary <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section story-section">
        <div className="container story-layout">
          <Reveal>
            <div className="story-visual">
              <div className="story-image">
                <Image
                  src={photos.bali}
                  alt="Lush tropical landscape in Bali"
                  fill
                  sizes="(max-width:900px) 95vw, 45vw"
                  className="image-cover"
                />
              </div>
              <div className="story-small-image">
                <Image
                  src={photos.ocean}
                  alt="Turquoise island waters"
                  fill
                  sizes="230px"
                  className="image-cover"
                />
              </div>
              <div className="story-seal">
                <span>✳</span>
                <small>
                  MORE THAN
                  <br />A HOLIDAY
                </small>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="story-copy">
              <span className="eyebrow">THIS IS OUR KIND OF MAGIC</span>
              <h2>
                It's not just where you go. <em>It's how you feel.</em>
              </h2>
              <p>
                We believe the best journeys aren&apos;t one-size-fits-all. They are made of the
                little things: a perfect sunrise, a new favourite place, and time well spent with
                your favourite people.
              </p>
              <div className="story-features">
                <div>
                  <span>
                    <BadgeCheck size={19} />
                  </span>
                  <div>
                    <h3>Made for your story</h3>
                    <p>Travel ideas shaped around your pace, style and priorities.</p>
                  </div>
                </div>
                <div>
                  <span>
                    <CalendarCheck2 size={19} />
                  </span>
                  <div>
                    <h3>Details thoughtfully handled</h3>
                    <p>From your first enquiry to your final travel plan.</p>
                  </div>
                </div>
              </div>
              <Link href="/about" className="btn btn-dark">
                A little more about us <ArrowUpRight size={17} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="steps-section">
        <div className="container">
          <Reveal>
            <div className="steps-heading">
              <span className="eyebrow eyebrow-light">GOOD TRIPS START HERE</span>
              <h2>
                From daydream to <em>departure.</em>
              </h2>
              <p>Planning your next getaway can be the easy part.</p>
            </div>
          </Reveal>
          <div className="steps-grid">
            {[
              {
                n: '01',
                icon: MapPin,
                title: 'Tell us your dream',
                text: 'Choose a destination, a travel style or simply tell us what you have in mind.',
              },
              {
                n: '02',
                icon: Compass,
                title: 'We shape the journey',
                text: 'We help refine the route, stays and experiences to suit your plans.',
              },
              {
                n: '03',
                icon: Waves,
                title: 'Enjoy the moments',
                text: 'Once you confirm the details, look forward to the moments that matter.',
              },
            ].map((item, i) => (
              <Reveal key={item.n} delay={i * 0.08}>
                <div className="step-card">
                  <div className="step-number">
                    {item.n}
                    <item.icon size={23} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Reveal>
            <SectionIntro
              eyebrow="POSTCARDS FROM THE WORLD"
              title="Little glimpses of somewhere beautiful."
              description="From misty mountain trails to beach sunsets—every place has its own story."
              href="/gallery"
              linkLabel="Explore the gallery"
            />
          </Reveal>
          <div className="home-gallery-grid">
            {galleryItems.slice(0, 4).map((item, i) => (
              <Reveal key={item.id} delay={i * 0.05}>
                <Link href="/gallery" className={`home-gallery-item home-gallery-${i}`}>
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width:700px) 90vw, 35vw"
                    className="image-cover"
                  />
                  <span>
                    {item.title}
                    <MoveUpRight size={17} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          <p className="photo-note">
            Destination photography is illustrative; customer tour photos will be published only
            with permission.
          </p>
        </div>
      </section>
      <section id="reviews" className="review-teaser">
        <div className="container review-teaser-inner">
          <span className="eyebrow">CUSTOMER REVIEWS</span>
          <h2>
            Real journeys.
            <br />
            <em>Stories worth sharing.</em>
          </h2>
          <p>Travel memories, told by the people who made them.</p>
          <ReviewsCarousel />
          <Link href="/reviews" className="btn btn-dark">
            Explore customer stories <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="section callout-wrap">
        <div className="container">
          <div className="cta-banner">
            <Image
              src={photos.ocean}
              alt="Aerial view of the turquoise ocean"
              fill
              sizes="100vw"
              className="image-cover"
            />
            <div className="cta-overlay" />
            <div className="cta-content">
              <span className="eyebrow eyebrow-light">YOUR NEXT CHAPTER STARTS HERE</span>
              <h2>
                Ready to get
                <br />
                <em>away from ordinary?</em>
              </h2>
              <p>Tell us what you&apos;re dreaming of. We&apos;ll help you find your way there.</p>
              <Link href="/contact" className="btn btn-primary btn-large">
                Let's plan something beautiful <ArrowUpRight size={19} />
              </Link>
            </div>
            <span className="cta-decor">✳</span>
          </div>
        </div>
      </section>
    </>
  );
}
