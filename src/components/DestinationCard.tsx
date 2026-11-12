import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Destination } from '@/data/site';
export default function DestinationCard({
  destination,
  index = 0,
}: {
  destination: Destination;
  index?: number;
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={`destination-card destination-card-${index % 4}`}
    >
      <Image
        src={destination.image}
        alt={`Scenic view of ${destination.name}`}
        fill
        sizes="(max-width: 700px) 90vw, (max-width:1100px) 45vw, 28vw"
        className="image-cover"
      />
      <div className="destination-card-shade" />
      <span className="destination-tag">
        {destination.region === 'India' ? 'DOMESTIC' : 'INTERNATIONAL'}
      </span>
      <div className="destination-card-content">
        <div>
          <span>
            <MapPin size={13} />
            {destination.location}
          </span>
          <h3>{destination.name}</h3>
        </div>
        <span className="round-arrow">
          <ArrowUpRight size={21} />
        </span>
      </div>
    </Link>
  );
}
