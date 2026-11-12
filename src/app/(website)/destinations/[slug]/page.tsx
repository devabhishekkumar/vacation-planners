import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowUpRight, ChevronRight, MapPin } from 'lucide-react';
import PackageCard from '@/components/PackageCard';
import { getSiteContent } from '@/lib/content/service';
export async function generateStaticParams() {
  const { destinations } = await getSiteContent();
  return destinations.map((d) => ({ slug: d.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { destinations } = await getSiteContent();
  const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);
  const { slug } = await params;
  const d = getDestination(slug);
  return { title: d ? `${d.name} Holidays` : 'Destination not found', description: d?.description };
}
export default async function DestinationDetails({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { destinations, packages } = await getSiteContent();
  const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) notFound();
  const tours = packages.filter((t) => t.destinationSlug === slug);
  return (
    <>
      <section className="destination-detail-hero">
        <Image
          src={destination.image}
          alt={`${destination.name} landscape`}
          fill
          sizes="100vw"
          priority
          className="image-cover"
        />
        <div className="destination-detail-shade" />
        <div className="container destination-detail-content">
          <div className="breadcrumbs breadcrumbs-light">
            <Link href="/">Home</Link>
            <ChevronRight size={14} />
            <Link href="/destinations">Destinations</Link>
            <ChevronRight size={14} />
            <span>{destination.name}</span>
          </div>
          <span className="eyebrow eyebrow-light">{destination.eyebrow}</span>
          <h1>{destination.name}</h1>
          <p>
            <MapPin size={17} />
            {destination.location}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container destination-intro-layout">
          <div>
            <span className="eyebrow">DISCOVER {destination.name.toUpperCase()}</span>
            <h2>
              A little more of the world, a little more <em>of yourself.</em>
            </h2>
          </div>
          <div>
            <p>
              {destination.description} Explore our suggested itineraries, or talk to us about
              making the journey your own.
            </p>
            <Link href="/contact" className="btn btn-dark">
              Plan a {destination.name} getaway <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-warm">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">SUGGESTED ITINERARIES</span>
              <h2 className="section-title">Explore {destination.name} with us.</h2>
            </div>
          </div>
          <div className="packages-grid">
            {tours.map((t) => (
              <PackageCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
