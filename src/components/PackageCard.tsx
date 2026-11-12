import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import type { TourPackage } from '@/data/site';
export default function PackageCard({ tour }: { tour: TourPackage }) {
  return (
    <article className="package-card">
      <Link
        className="package-media"
        href={`/packages/${tour.slug}`}
        aria-label={`Explore ${tour.title}`}
      >
        <Image
          src={tour.image}
          alt={`${tour.title} destination`}
          fill
          sizes="(max-width:700px) 90vw, (max-width:1024px) 45vw, 30vw"
          className="image-cover"
        />
        {tour.label && <span className="package-ribbon">{tour.label}</span>}
      </Link>
      <div className="package-content">
        <div className="package-meta">
          <span>
            <MapPin size={14} />
            {tour.country}
          </span>
          <span>
            <CalendarDays size={14} />
            {tour.duration}
          </span>
        </div>
        <Link href={`/packages/${tour.slug}`}>
          <h3>{tour.title}</h3>
        </Link>
        <p>{tour.summary}</p>
        <div className="package-footer">
          <Link className="text-link" href={`/book/${tour.slug}`} aria-label={`Book ${tour.title}`}>
            Book now
          </Link>
          <Link
            className="round-arrow round-arrow-dark"
            href={`/packages/${tour.slug}`}
            aria-label={`View ${tour.title}`}
          >
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
