import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { getSiteContent } from '@/lib/content/service';
export const metadata: Metadata = {
  title: 'Travel Journal',
  description: 'Travel guides, destination inspiration and holiday planning tips.',
};
export default async function BlogPage() {
  const { articleCards, photos } = await getSiteContent();
  return (
    <>
      <PageHero
        eyebrow="THE TRAVEL JOURNAL"
        title="For the love of going places."
        description="Ideas, inspiration and little pieces of travel wisdom for your next adventure."
        image={photos.forest}
        crumb="Travel journal"
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">WORDS FOR WANDERERS</span>
              <h2 className="section-title">
                Notes from <em>the road.</em>
              </h2>
            </div>
          </div>
          <div className="blog-grid">
            {articleCards.map((a) => (
              <article className="blog-card" key={a.slug}>
                <Link href={`/blog/${a.slug}`} className="blog-image">
                  <Image
                    src={a.image}
                    alt={a.title}
                    fill
                    sizes="(max-width:700px) 95vw, 33vw"
                    className="image-cover"
                  />
                </Link>
                <div className="blog-meta">
                  <span>{a.category}</span>
                  <span>
                    <Clock size={14} /> {a.read}
                  </span>
                </div>
                <h2>
                  <Link href={`/blog/${a.slug}`}>{a.title}</Link>
                </h2>
                <p>{a.excerpt}</p>
                <Link className="blog-more" href={`/blog/${a.slug}`}>
                  Read the story <ArrowUpRight size={17} />
                </Link>
              </article>
            ))}
          </div>
          <p className="photo-note">
            Editorial previews are starter content. Final articles should be reviewed and approved
            before publishing.
          </p>
        </div>
      </section>
    </>
  );
}
