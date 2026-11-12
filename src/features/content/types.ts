import type { Destination, TourPackage, galleryItems, articleCards, photos } from '../../data/site';
export type SiteContent = {
  destinations: Destination[];
  packages: TourPackage[];
  galleryItems: typeof galleryItems;
  articleCards: typeof articleCards;
  photos: typeof photos;
};
export type ContentCollection = 'packages' | 'destinations' | 'galleryItems' | 'articleCards';
export type ContentField = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'image' | 'list' | 'itinerary';
  required?: boolean;
  options?: string[];
};
export const contentDefinitions: Record<
  ContentCollection,
  { label: string; fields: ContentField[]; blank: Record<string, unknown> }
> = {
  packages: {
    label: 'Tour packages',
    fields: [
      { key: 'slug', label: 'Page URL name', required: true },
      { key: 'title', label: 'Package title', required: true },
      { key: 'destinationSlug', label: 'Destination URL name', required: true },
      { key: 'country', label: 'Country', required: true },
      { key: 'duration', label: 'Duration', required: true },
      { key: 'nights', label: 'Nights', type: 'number' },
      {
        key: 'type',
        label: 'Trip type',
        options: [
          'Nature & Mountains',
          'Honeymoon',
          'Culture & Heritage',
          'Beach Escape',
          'City & Luxury',
          'Family Holiday',
        ],
        required: true,
      },
      { key: 'label', label: 'Card label' },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'image', label: 'Cover image', type: 'image', required: true },
      { key: 'images', label: 'Gallery image URLs (one per line)', type: 'list' },
      { key: 'highlights', label: 'Highlights (one per line)', type: 'list' },
      { key: 'included', label: 'Inclusions (one per line)', type: 'list' },
      { key: 'excluded', label: 'Exclusions (one per line)', type: 'list' },
      { key: 'itinerary', label: 'Day-wise itinerary', type: 'itinerary' },
    ],
    blank: {
      slug: '',
      title: '',
      destinationSlug: '',
      country: '',
      duration: '',
      nights: 1,
      type: 'Nature & Mountains',
      label: '',
      summary: '',
      image: '',
      images: [],
      highlights: [],
      included: [],
      excluded: [],
      itinerary: [],
    },
  },
  destinations: {
    label: 'Destinations',
    fields: [
      { key: 'slug', label: 'Page URL name', required: true },
      { key: 'name', label: 'Destination name', required: true },
      { key: 'region', label: 'Region', options: ['India', 'International'], required: true },
      { key: 'location', label: 'Location', required: true },
      { key: 'eyebrow', label: 'Heading label', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'image', label: 'Cover image', type: 'image', required: true },
      { key: 'featured', label: 'Featured on homepage', type: 'boolean' },
    ],
    blank: {
      slug: '',
      name: '',
      region: 'India',
      location: '',
      eyebrow: '',
      description: '',
      image: '',
      featured: false,
    },
  },
  galleryItems: {
    label: 'Gallery',
    fields: [
      { key: 'id', label: 'Photo number', type: 'number' },
      { key: 'title', label: 'Photo title', required: true },
      {
        key: 'category',
        label: 'Category',
        options: ['Nature', 'Beaches', 'Culture', 'Cities'],
        required: true,
      },
      { key: 'src', label: 'Image URL', type: 'image', required: true },
    ],
    blank: { id: 1, title: '', category: 'Nature', src: '' },
  },
  articleCards: {
    label: 'Travel journal',
    fields: [
      { key: 'slug', label: 'Page URL name', required: true },
      { key: 'title', label: 'Article title', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'read', label: 'Reading time', required: true },
      { key: 'excerpt', label: 'Summary', type: 'textarea', required: true },
      { key: 'image', label: 'Cover image', type: 'image', required: true },
      { key: 'body', label: 'Article paragraphs (one per line)', type: 'list' },
    ],
    blank: {
      slug: '',
      title: '',
      category: 'TRAVEL TIPS',
      read: '5 min read',
      excerpt: '',
      image: '',
      body: [],
    },
  },
};
