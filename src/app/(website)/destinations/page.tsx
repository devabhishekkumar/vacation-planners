import type { Metadata } from 'next';
import Image from 'next/image';
import DestinationCard from '@/components/DestinationCard';
import PageHero from '@/components/PageHero';
import SectionIntro from '@/components/SectionIntro';
import { getSiteContent } from '@/lib/content/service';
export const metadata: Metadata = {
  title: 'Destinations',
  description: 'Explore holiday destinations across India and around the world.',
};
export default function DestinationsPage() {
  const { destinations, photos } = getSiteContent();

  return (
    <>
      <PageHero
        eyebrow="THE WORLD IS YOURS"
        title="Where will you go next?"
        description="A world of unforgettable places awaits. Start with a destination and follow your curiosity."
        image={photos.bali}
        crumb="Destinations"
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="A PLACE FOR EVERY MOOD"
            title="Find your kind of beautiful."
            description="From the mountains of India to sun-drenched islands far away."
          />
          <div className="destinations-grid destination-directory">
            {destinations.map((d, i) => (
              <DestinationCard key={d.slug} destination={d} index={i} />
            ))}
          </div>
        </div>
      </section>
      <section className="destination-bottom">
        <div className="container destination-bottom-content">
          <div>
            <span className="eyebrow">NOT SURE WHERE TO BEGIN?</span>
            <h2>
              We love a blank map <em>and a big idea.</em>
            </h2>
            <p>
              Tell us the kind of experiences you love, and we&apos;ll help you explore
              possibilities.
            </p>
            <a href="/contact" className="btn btn-primary">
              Help me choose a place →
            </a>
          </div>
          <div className="destination-bottom-image">
            <Image
              src={photos.santorini}
              alt="Coastal architecture overlooking the sea"
              fill
              sizes="45vw"
              className="image-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
