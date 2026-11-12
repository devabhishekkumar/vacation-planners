import SiteHeader from '@/components/SiteHeader';
import { requireCustomer } from '@/lib/auth/customer-session';
import { travelBooking } from '@/lib/travel/service';
import { notFound } from 'next/navigation';
import TravelManager from '@/components/travel/TravelManager';
import '@/components/travel/travel.css';
export const dynamic = 'force-dynamic';
export default async function CustomerTravel({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const user = await requireCustomer(`/customer/travel/${bookingId}`);
  try {
    travelBooking(bookingId, { admin: false, customerId: user.id });
  } catch {
    notFound();
  }
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="tm-customer-shell">
        <TravelManager key={bookingId} bookingId={bookingId} />
      </main>
    </>
  );
}
