import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Vacation Planners | Go somewhere wonderful',
    template: '%s | Vacation Planners',
  },
  description:
    'Explore thoughtfully curated destinations, holiday packages and personalised travel planning with Vacation Planners.',
  robots: { index: false, follow: false }, // Demo only: re-evaluate before launch.
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
