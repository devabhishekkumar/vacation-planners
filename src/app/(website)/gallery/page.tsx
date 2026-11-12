import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import GalleryExplorer from '@/components/GalleryExplorer';
import { getSiteContent } from '@/lib/content/service';
export const metadata: Metadata = {
  title: 'Travel Gallery',
  description: 'Explore inspiring moments and destination photography from around the world.',
};
export default async function GalleryPage() {
  const { photos, galleryItems } = await getSiteContent();
  return (
    <>
      <PageHero
        eyebrow="A FEW FAVOURITE MOMENTS"
        title="A little window to the world."
        description="Every place has a thousand stories. Here are a few places to start dreaming."
        image={photos.santorini}
        crumb="Gallery"
      />
      <section className="section">
        <div className="container">
          <div className="gallery-intro">
            <span className="eyebrow">THE WORLD IN FRAMES</span>
            <h2>
              Dream in <em>full colour.</em>
            </h2>
            <p>Explore beautiful destinations and imagine the memories waiting to be made.</p>
          </div>
          <GalleryExplorer galleryItems={galleryItems} />
          <p className="photo-note">
            These are illustrative destination photographs, not customer tour photos. Customer
            images will be added only with permission.
          </p>
        </div>
      </section>
    </>
  );
}
