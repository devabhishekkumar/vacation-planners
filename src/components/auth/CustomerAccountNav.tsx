'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Luggage, UserRound, Compass } from 'lucide-react';
export default function CustomerAccountNav() {
  const pathname = usePathname();
  return (
    <nav className="customer-account-tabs" aria-label="Customer account">
      {[
        { href: '/customer', label: 'My bookings', icon: Luggage },
        { href: '/customer/travel', label: 'My travel details', icon: Luggage },
        { href: '/customer/profile', label: 'My profile', icon: UserRound },
        { href: '/packages', label: 'Explore', icon: Compass },
      ].map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
          <Icon size={16} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
