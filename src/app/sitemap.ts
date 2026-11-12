export const dynamic = 'force-dynamic';
import type { MetadataRoute } from 'next';
import { getSiteContent } from '@/lib/content/service';
export default function sitemap(): MetadataRoute.Sitemap {
  const { articleCards, destinations, packages } = getSiteContent();

  // Replace with the real production domain before enabling indexing.
  const base = 'https://example.com';
  return [
    '',
    '/about',
    '/contact',
    '/destinations',
    '/packages',
    '/gallery',
    '/reviews',
    '/blog',
    ...destinations.map((d) => `/destinations/${d.slug}`),
    ...packages.map((p) => `/packages/${p.slug}`),
    ...articleCards.map((a) => `/blog/${a.slug}`),
  ].map((path) => ({
    url: base + path,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.65,
  }));
}
