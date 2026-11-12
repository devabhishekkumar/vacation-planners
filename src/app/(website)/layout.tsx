export const dynamic = 'force-dynamic';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
    </>
  );
}
