import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import PackageExplorer from '@/components/PackageExplorer';
import { getSiteContent } from '@/lib/content/service';
export const metadata: Metadata = {
  title: 'Tour Packages',
  description: 'Discover domestic and international travel ideas with Vacation Planners.',
};
export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; type?: string; duration?: string }>;
}) {
  const { photos, packages, destinations } = getSiteContent();

  const filters = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="CHOOSE YOUR ADVENTURE"
        title="Journeys made for you."
        description="Browse our favourite travel ideas. Every itinerary can be adapted to your preferences."
        image={photos.alpine}
        crumb="Tour packages"
      />
      <section className="section">
        <PackageExplorer
          packages={packages}
          destinations={destinations}
          initialDestination={filters.destination || ''}
          initialType={filters.type || ''}
          initialDuration={filters.duration || ''}
        />
      </section>
    </>
  );
}
