export type TripType =
  | 'Nature & Mountains'
  | 'Honeymoon'
  | 'Culture & Heritage'
  | 'Beach Escape'
  | 'City & Luxury'
  | 'Family Holiday';
export type Destination = {
  slug: string;
  name: string;
  region: string;
  location: string;
  eyebrow: string;
  description: string;
  image: string;
  featured?: boolean;
};
export type ItineraryDay = { day: number; title: string; detail: string };
export type TourPackage = {
  slug: string;
  title: string;
  destinationSlug: string;
  country: string;
  duration: string;
  nights: number;
  type: TripType;
  label?: string;
  summary: string;
  image: string;
  images: string[];
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryDay[];
};
export const photos = {
  hero: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2000&q=85',
  ocean:
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1500&q=85',
  alpine:
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1500&q=85',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1500&q=85',
  kashmir:
    'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1400&q=85',
  kerala:
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1500&q=85',
  rajasthan:
    'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1400&q=85',
  dubai:
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=85',
  switzerland:
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1400&q=85',
  japan:
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=85',
  santorini:
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1400&q=85',
  forest:
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85',
  beach:
    'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=85',
};
export const destinations: Destination[] = [
  {
    slug: 'kashmir',
    name: 'Kashmir',
    region: 'India',
    location: 'Northern India',
    eyebrow: 'THE GREAT OUTDOORS',
    description: 'Snow-dusted mountains, serene valleys and houseboat mornings.',
    image: photos.kashmir,
    featured: true,
  },
  {
    slug: 'bali',
    name: 'Bali',
    region: 'International',
    location: 'Indonesia',
    eyebrow: 'TROPICAL ESCAPES',
    description: 'Quiet temples, lush rice terraces and unforgettable sunsets.',
    image: photos.bali,
    featured: true,
  },
  {
    slug: 'maldives',
    name: 'Maldives',
    region: 'International',
    location: 'Indian Ocean',
    eyebrow: 'ISLAND TIME',
    description: 'Turquoise lagoons, overwater stays and days made for slowing down.',
    image: photos.ocean,
    featured: true,
  },
  {
    slug: 'kerala',
    name: 'Kerala',
    region: 'India',
    location: 'Southern India',
    eyebrow: 'SLOW TRAVEL',
    description: 'Palm-fringed backwaters, coastal flavours and green hill stations.',
    image: photos.kerala,
    featured: true,
  },
  {
    slug: 'rajasthan',
    name: 'Rajasthan',
    region: 'India',
    location: 'Western India',
    eyebrow: 'HERITAGE & CULTURE',
    description: 'Royal forts, warm desert light and stories around every corner.',
    image: photos.rajasthan,
  },
  {
    slug: 'dubai',
    name: 'Dubai',
    region: 'International',
    location: 'United Arab Emirates',
    eyebrow: 'CITY ADVENTURES',
    description: 'Remarkable skylines, desert adventures and modern luxury.',
    image: photos.dubai,
  },
  {
    slug: 'switzerland',
    name: 'Switzerland',
    region: 'International',
    location: 'Central Europe',
    eyebrow: 'ALPINE DREAMS',
    description: 'Mountain railways, mirror lakes and postcard-perfect villages.',
    image: photos.alpine,
  },
  {
    slug: 'japan',
    name: 'Japan',
    region: 'International',
    location: 'East Asia',
    eyebrow: 'CULTURE & WONDER',
    description: 'Ancient temples, vibrant cities and beautiful seasonal landscapes.',
    image: photos.japan,
  },
];
const standardIncluded = [
  'Accommodation options as confirmed in your quote',
  'Sightseeing arrangements listed in the final itinerary',
  'Trip planning and on-trip support',
];
const standardExcluded = [
  'Flights unless specifically included',
  'Personal expenses and optional activities',
  'Travel insurance and visa fees where applicable',
];
export const packages: TourPackage[] = [
  {
    slug: 'kashmir-valley-escape',
    title: 'Kashmir Valley Escape',
    destinationSlug: 'kashmir',
    country: 'India',
    duration: '6 days / 5 nights',
    nights: 5,
    type: 'Nature & Mountains',
    label: 'Most loved',
    summary: 'A scenic journey through Srinagar, alpine valleys and the quiet beauty of Kashmir.',
    image: photos.kashmir,
    images: [photos.kashmir, photos.alpine, photos.forest],
    highlights: [
      'Srinagar houseboat experience',
      'Gulmarg mountain landscapes',
      'Pahalgam valley sightseeing',
    ],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      {
        day: 1,
        title: 'Welcome to Srinagar',
        detail: 'Arrive, settle in and enjoy a relaxed evening by Dal Lake.',
      },
      {
        day: 2,
        title: 'Explore Srinagar',
        detail: 'Discover gardens, local markets and lakeside views at your own pace.',
      },
      {
        day: 3,
        title: 'Scenic Gulmarg',
        detail: 'Travel toward snow-clad peaks and enjoy the mountain surroundings.',
      },
      {
        day: 4,
        title: 'Journey to Pahalgam',
        detail: 'Explore beautiful valleys, riverside landscapes and mountain roads.',
      },
      {
        day: 5,
        title: 'A day to unwind',
        detail: 'Enjoy flexible sightseeing or optional experiences suited to your group.',
      },
      { day: 6, title: 'Departure', detail: 'Check out and transfer for your onward journey.' },
    ],
  },
  {
    slug: 'bali-island-discovery',
    title: 'Bali Island Discovery',
    destinationSlug: 'bali',
    country: 'Indonesia',
    duration: '7 days / 6 nights',
    nights: 6,
    type: 'Honeymoon',
    label: 'Couples favourite',
    summary: 'Slow island mornings, emerald landscapes and spectacular coastal sunsets.',
    image: photos.bali,
    images: [photos.bali, photos.beach, photos.santorini],
    highlights: ['Ubud rice terraces', 'Balinese cultural experiences', 'Coastal sunset moments'],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      {
        day: 1,
        title: 'Arrive in Bali',
        detail: 'Airport welcome and transfer to your accommodation.',
      },
      {
        day: 2,
        title: 'Discover Ubud',
        detail: 'Take in the art, temples and terraced landscapes of Ubud.',
      },
      {
        day: 3,
        title: 'Bali at your pace',
        detail: 'Choose from cultural visits, wellness experiences or nature walks.',
      },
      {
        day: 4,
        title: 'Head for the coast',
        detail: 'Transfer toward Bali’s coastline and enjoy the seaside atmosphere.',
      },
      {
        day: 5,
        title: 'Island exploring',
        detail: 'Spend the day discovering beaches and scenic viewpoints.',
      },
      {
        day: 6,
        title: 'Your free day',
        detail: 'Time for a relaxed day or additional experiences by request.',
      },
      {
        day: 7,
        title: 'Homeward journey',
        detail: 'Check out and depart with memories of the island.',
      },
    ],
  },
  {
    slug: 'maldives-blue-horizons',
    title: 'Maldives Blue Horizons',
    destinationSlug: 'maldives',
    country: 'Maldives',
    duration: '5 days / 4 nights',
    nights: 4,
    type: 'Beach Escape',
    label: 'Island retreat',
    summary: 'Crystal-clear water, unhurried days and a little space to do absolutely nothing.',
    image: photos.ocean,
    images: [photos.ocean, photos.beach, photos.santorini],
    highlights: ['Lagoon-side relaxation', 'Resort experiences', 'Optional snorkelling adventures'],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      {
        day: 1,
        title: 'Welcome to the islands',
        detail: 'Arrive and transfer to your chosen island stay.',
      },
      {
        day: 2,
        title: 'A day by the lagoon',
        detail: 'Relax on the beach or explore available water activities.',
      },
      {
        day: 3,
        title: 'Ocean adventures',
        detail: 'Optional snorkelling or island experiences, subject to availability.',
      },
      {
        day: 4,
        title: 'Slow island living',
        detail: 'A full day to enjoy the resort and the surrounding turquoise waters.',
      },
      { day: 5, title: 'Departure', detail: 'Transfer to the airport for your onward journey.' },
    ],
  },
  {
    slug: 'kerala-backwaters-hills',
    title: 'Kerala Backwaters & Hills',
    destinationSlug: 'kerala',
    country: 'India',
    duration: '6 days / 5 nights',
    nights: 5,
    type: 'Family Holiday',
    label: 'Family pick',
    summary: 'An easygoing trip through rolling green hills, tea country and peaceful backwaters.',
    image: photos.kerala,
    images: [photos.kerala, photos.forest, photos.beach],
    highlights: ['Munnar tea country', 'Backwater experience', 'Cultural and nature stops'],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      {
        day: 1,
        title: 'Arrive in Kochi',
        detail: 'Arrive and begin the journey into Kerala’s scenic landscapes.',
      },
      {
        day: 2,
        title: 'Munnar highlights',
        detail: 'Explore tea gardens, hill roads and local viewpoints.',
      },
      {
        day: 3,
        title: 'More of the hills',
        detail: 'A relaxed day for nature spots and family-friendly sightseeing.',
      },
      {
        day: 4,
        title: 'Journey to the backwaters',
        detail: 'Travel toward Alleppey’s calm waterways and village landscapes.',
      },
      {
        day: 5,
        title: 'Explore the coast',
        detail: 'Enjoy local culture, beaches or markets depending on your plan.',
      },
      { day: 6, title: 'Travel home', detail: 'Depart after breakfast for your onward journey.' },
    ],
  },
  {
    slug: 'royal-rajasthan-trail',
    title: 'Royal Rajasthan Trail',
    destinationSlug: 'rajasthan',
    country: 'India',
    duration: '7 days / 6 nights',
    nights: 6,
    type: 'Culture & Heritage',
    summary: 'Colourful bazaars, magnificent forts and regal architecture across Rajasthan.',
    image: photos.rajasthan,
    images: [photos.rajasthan, photos.santorini, photos.forest],
    highlights: ['Jaipur heritage sites', 'Jodhpur old-city charm', 'Udaipur lake views'],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      {
        day: 1,
        title: 'Start in Jaipur',
        detail: 'Arrive and explore the Pink City’s lively atmosphere.',
      },
      {
        day: 2,
        title: 'Jaipur landmarks',
        detail: 'A day of forts, palaces and traditional markets.',
      },
      {
        day: 3,
        title: 'Journey onward',
        detail: 'Travel between royal cities with cultural stops along the way.',
      },
      {
        day: 4,
        title: 'Jodhpur discoveries',
        detail: 'Explore historic lanes, sweeping fort views and local cuisine.',
      },
      {
        day: 5,
        title: 'Toward Udaipur',
        detail: 'Journey through Rajasthan to the romantic city of lakes.',
      },
      {
        day: 6,
        title: 'Lake city moments',
        detail: 'Relax with heritage sightseeing and lakeside walks.',
      },
      { day: 7, title: 'Departure', detail: 'Wrap up your journey and travel onward.' },
    ],
  },
  {
    slug: 'dubai-desert-and-skyline',
    title: 'Dubai Desert & Skyline',
    destinationSlug: 'dubai',
    country: 'United Arab Emirates',
    duration: '5 days / 4 nights',
    nights: 4,
    type: 'City & Luxury',
    summary: 'A vibrant blend of futuristic city experiences and Arabian desert landscapes.',
    image: photos.dubai,
    images: [photos.dubai, photos.beach, photos.santorini],
    highlights: [
      'City skyline landmarks',
      'Desert excursion option',
      'Shopping and cultural quarters',
    ],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      { day: 1, title: 'Dubai arrival', detail: 'Airport arrival and transfer to your stay.' },
      {
        day: 2,
        title: 'Discover the skyline',
        detail: 'Explore iconic landmarks and modern city sights.',
      },
      {
        day: 3,
        title: 'Desert landscapes',
        detail: 'Optional desert experience with arrangements confirmed in advance.',
      },
      {
        day: 4,
        title: 'Your Dubai, your way',
        detail: 'Enjoy shopping, cultural neighbourhoods or additional attractions.',
      },
      { day: 5, title: 'Departure', detail: 'Check out and transfer to the airport.' },
    ],
  },
  {
    slug: 'swiss-alpine-stories',
    title: 'Swiss Alpine Stories',
    destinationSlug: 'switzerland',
    country: 'Switzerland',
    duration: '8 days / 7 nights',
    nights: 7,
    type: 'Nature & Mountains',
    summary:
      'A peaceful European escape through dramatic alpine scenery and lovely lakeside towns.',
    image: photos.alpine,
    images: [photos.alpine, photos.switzerland, photos.forest],
    highlights: [
      'Alpine mountain scenery',
      'Charming lakeside towns',
      'Optional scenic train experiences',
    ],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      {
        day: 1,
        title: 'Arrive in Switzerland',
        detail: 'Welcome and check in for the start of your journey.',
      },
      {
        day: 2,
        title: 'Lakes and old towns',
        detail: 'Explore picturesque waterfronts and local streets.',
      },
      {
        day: 3,
        title: 'Into the mountains',
        detail: 'Take in panoramic alpine landscapes and viewpoints.',
      },
      {
        day: 4,
        title: 'Swiss villages',
        detail: 'Discover traditional villages and scenic surroundings.',
      },
      {
        day: 5,
        title: 'A flexible exploration day',
        detail: 'Optional excursions can be tailored to your preferences.',
      },
      {
        day: 6,
        title: 'Another alpine chapter',
        detail: 'Enjoy a different mountain area or a relaxed lakeside day.',
      },
      {
        day: 7,
        title: 'Last full day',
        detail: 'Make time for favourite places and final discoveries.',
      },
      { day: 8, title: 'Departure', detail: 'Check out and continue your onward travel.' },
    ],
  },
  {
    slug: 'japan-culture-and-colour',
    title: 'Japan Culture & Colour',
    destinationSlug: 'japan',
    country: 'Japan',
    duration: '8 days / 7 nights',
    nights: 7,
    type: 'Culture & Heritage',
    summary: 'From tranquil temples to modern city energy, discover Japan’s many moods.',
    image: photos.japan,
    images: [photos.japan, photos.santorini, photos.forest],
    highlights: ['Traditional Kyoto neighbourhoods', 'Tokyo city energy', 'Cultural experiences'],
    included: standardIncluded,
    excluded: standardExcluded,
    itinerary: [
      { day: 1, title: 'Welcome to Japan', detail: 'Arrive and settle into your first city stay.' },
      {
        day: 2,
        title: 'Traditional highlights',
        detail: 'Explore temples, gardens and historic streets.',
      },
      {
        day: 3,
        title: 'Local discoveries',
        detail: 'Enjoy neighbourhood walks, cultural stops and local flavours.',
      },
      {
        day: 4,
        title: 'Journey between cities',
        detail: 'Travel onward and experience a change of scenery.',
      },
      {
        day: 5,
        title: 'Modern Japan',
        detail: 'Discover dynamic streets, creative districts and city sights.',
      },
      {
        day: 6,
        title: 'Explore your interests',
        detail: 'Choose cultural visits or a personalised optional experience.',
      },
      { day: 7, title: 'Final day of discovery', detail: 'Relax and take in your last full day.' },
      { day: 8, title: 'Departure', detail: 'Check out for your return journey.' },
    ],
  },
];
export const articleCards = [
  {
    slug: 'how-to-plan-a-stress-free-holiday',
    title: 'The art of planning a stress-free holiday',
    category: 'TRAVEL TIPS',
    read: '5 min read',
    excerpt: 'A simple, thoughtful checklist to make your next trip feel effortless.',
    image: photos.beach,
    body: [
      'Start with the feeling you want from your trip rather than only a list of attractions. Decide whether you want to rest, explore, celebrate or reconnect.',
      'Choose a practical length of stay and leave space in your days. A flexible itinerary often makes travel feel more rewarding.',
      'Keep important travel documents, confirmation details and emergency contacts in one secure place. Confirm requirements with official sources before departure.',
    ],
  },
  {
    slug: 'a-slower-side-of-bali',
    title: 'Beyond the beaches: a slower side of Bali',
    category: 'DESTINATION GUIDE',
    read: '4 min read',
    excerpt: 'Rice terraces, small villages and the joy of travelling at your own pace.',
    image: photos.bali,
    body: [
      'Bali offers a wonderful combination of beautiful coastal landscapes and inland cultural experiences.',
      'For a varied journey, balance lively beach time with quiet mornings among the terraces and craft villages around Ubud.',
      'Check local access, weather, transport and cultural etiquette before visiting specific sites.',
    ],
  },
  {
    slug: 'mountain-getaway-packing-list',
    title: 'What to pack for a mountain getaway',
    category: 'PACKING GUIDE',
    read: '3 min read',
    excerpt: 'A practical packing guide for crisp mornings and changing mountain weather.',
    image: photos.alpine,
    body: [
      'Mountain conditions can change quickly, so comfortable layers and weather-appropriate footwear are useful starting points.',
      'Keep medication, identity documents, a reusable water bottle and required personal essentials handy.',
      'For specific elevations and seasons, check current destination guidance and local weather forecasts before you travel.',
    ],
  },
];
export const galleryItems = [
  { id: 1, src: photos.bali, title: 'The green heart of Bali', category: 'Nature' },
  { id: 2, src: photos.ocean, title: 'The blues of the Maldives', category: 'Beaches' },
  { id: 3, src: photos.kashmir, title: 'Kashmir mountain mornings', category: 'Nature' },
  { id: 4, src: photos.rajasthan, title: 'Heritage in Rajasthan', category: 'Culture' },
  { id: 5, src: photos.kerala, title: 'A quieter kind of journey', category: 'Nature' },
  { id: 6, src: photos.dubai, title: 'Dubai after the sun goes down', category: 'Cities' },
  { id: 7, src: photos.alpine, title: 'Alpine horizons', category: 'Nature' },
  { id: 8, src: photos.japan, title: 'Japan in colour', category: 'Culture' },
  { id: 9, src: photos.santorini, title: 'Sunwashed island architecture', category: 'Beaches' },
];
export const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);
export const getPackage = (slug: string) => packages.find((p) => p.slug === slug);
