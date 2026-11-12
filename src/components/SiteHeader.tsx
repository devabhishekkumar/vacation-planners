'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useRouteToggle } from '@/hooks/useRouteToggle';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Brand from './Brand';
import ProfileDropdown from './ProfileDropdown';
const navigation = [
  { href: '/', label: 'Home' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/packages', label: 'Tour packages' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About us' },
  { href: '/blog', label: 'Travel journal' },
];
export default function SiteHeader() {
  const [open, setOpen] = useRouteToggle();
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);
  return (
    <div className="site-navigation">
      <div className="announcement">
        <span>Collect moments, not things.</span>
        <span className="announcement-right">
          Thoughtfully planned journeys, made for you <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="site-header">
        <div className="container nav-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <ProfileDropdown onOpen={() => setOpen(false)} />
            <Link className="btn btn-dark btn-small desktop-contact" href="/contact">
              Plan your trip <ArrowUpRight size={16} />
            </Link>
            <button
              className="mobile-menu-button"
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="mobile-menu">
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <Link href="/customer/profile">
              My Profile
              <ArrowUpRight size={18} />
            </Link>
            <Link className="btn btn-primary" href="/contact">
              Start planning <ArrowUpRight size={17} />
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
