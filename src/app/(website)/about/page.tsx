import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Compass, Heart, Leaf, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { getSiteContent } from '@/lib/content/service';
export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn the story and travel philosophy behind Vacation Planners.',
};
export default async function AboutPage() {
  const { photos } = await getSiteContent();
  return (
    <>
      <PageHero
        eyebrow="HELLO, WE'RE VACATION PLANNERS"
        title="A little more about us."
        description="We believe that every remarkable holiday begins with a simple conversation."
        image={photos.kerala}
        crumb="About us"
      />
      <section className="section">
        <div className="container about-story-grid">
          <div className="about-story-image">
            <Image
              src={photos.ocean}
              alt="A serene island destination"
              fill
              sizes="(max-width:900px) 90vw, 42vw"
              className="image-cover"
            />
            <span className="about-image-stamp">
              LET&apos;S SEE THE WORLD <span>✳</span>
            </span>
          </div>
          <div className="about-story-copy">
            <span className="eyebrow">OUR TRAVEL PHILOSOPHY</span>
            <h2>
              Travel isn&apos;t about ticking boxes. <em>It&apos;s about feeling alive.</em>
            </h2>
            <p>
              At Vacation Planners, our vision is to make the planning part feel as exciting as the
              journey itself.
            </p>
            <p>
              We create space for the little moments that make a holiday memorable, whether that
              means discovering a new city, escaping to the mountains or spending more time with
              people you love.
            </p>
            <p>
              Share your ideas, your style and what matters most to you. Together, we&apos;ll turn
              those thoughts into a thoughtful travel plan.
            </p>
            <Link href="/contact" className="btn btn-dark">
              Tell us your travel dream <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-warm">
        <div className="container">
          <div className="center-heading">
            <span className="eyebrow">WHAT WE BELIEVE</span>
            <h2>
              Good travel begins with <em>good intentions.</em>
            </h2>
          </div>
          <div className="values-grid">
            {[
              {
                icon: Compass,
                title: 'Thoughtful discovery',
                text: 'Discover places and experiences that suit the kind of journey you want.',
              },
              {
                icon: Heart,
                title: 'Personal by nature',
                text: 'A holiday should feel like your holiday, not anybody else’s itinerary.',
              },
              {
                icon: Leaf,
                title: 'Room to breathe',
                text: 'We favour meaningful moments over rushing from stop to stop.',
              },
              {
                icon: ShieldCheck,
                title: 'Clear communication',
                text: 'We aim for clarity around travel plans, services and what is included.',
              },
            ].map((item) => (
              <div className="value-card" key={item.title}>
                <span>
                  <item.icon size={27} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="about-quote">
        <div className="container">
          <span>✳</span>
          <h2>
            “A wonderful journey is the one that feels <em>truly yours.</em>”
          </h2>
          <p>OUR GUIDING IDEA</p>
        </div>
      </section>
    </>
  );
}
