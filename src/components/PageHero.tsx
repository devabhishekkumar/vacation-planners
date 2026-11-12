import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
export default function PageHero({
  eyebrow,
  title,
  description,
  image,
  crumb,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  crumb?: string;
}) {
  return (
    <section className="page-hero">
      <Image
        src={image}
        alt="Scenic travel landscape"
        fill
        priority
        className="image-cover"
        sizes="100vw"
      />
      <div className="page-hero-overlay" />
      <div className="container page-hero-inner">
        <div className="breadcrumbs breadcrumbs-light">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <span>{crumb ?? title}</span>
        </div>
        <span className="eyebrow eyebrow-light">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
