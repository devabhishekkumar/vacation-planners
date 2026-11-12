import Link from 'next/link';
import { ArrowUpRight, Instagram, Mail, MapPin, MoveUpRight } from 'lucide-react';
import Brand from './Brand';
const links = [
  {
    title: 'Explore',
    links: [
      ['Destinations', '/destinations'],
      ['Travel packages', '/packages'],
      ['Photo gallery', '/gallery'],
      ['Travel journal', '/blog'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About us', '/about'],
      ['Customer reviews', '/reviews'],
      ['Contact us', '/contact'],
      ['Plan a journey', '/contact'],
    ],
  },
];
export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div>
          <span className="eyebrow eyebrow-light">LET&apos;S GO SOMEWHERE</span>
          <h2>
            Beautiful places.
            <br />
            <em>Better stories.</em>
          </h2>
        </div>
        <Link href="/contact" className="footer-cta">
          Let&apos;s plan your next escape <ArrowUpRight size={20} />
        </Link>
      </div>
      <div className="container footer-main">
        <div className="footer-brand">
          <Brand light />
          <p>
            Thoughtfully curated holidays, tailor-made itineraries and memorable journeys.
            Let&apos;s turn your next getaway into a story worth sharing.
          </p>
          <div className="footer-social">
            <Link href="/contact" aria-label="Contact Vacation Planners">
              <Mail size={18} />
            </Link>
            <Link href="/gallery" aria-label="Explore our gallery">
              <Instagram size={18} />
            </Link>
          </div>
        </div>
        {links.map((group) => (
          <div key={group.title} className="footer-links">
            <h3>{group.title}</h3>
            {group.links.map(([label, href]) => (
              <Link key={href + label} href={href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
        <div className="footer-links footer-address">
          <h3>Find us</h3>
          <p>
            <MapPin size={17} /> A14, 10th Main Road,
            <br /> Jayanagar 3rd Block
          </p>
          <Link
            href="https://www.google.com/maps/search/?api=1&query=A14%2C%2010th%20Main%20Road%2C%20Jayanagar%203rd%20Block"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Google Maps <MoveUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Vacation Planners. All rights reserved.</p>
        <p>
          Designed for the journey ahead. <span>✳</span>
        </p>
      </div>
    </footer>
  );
}
