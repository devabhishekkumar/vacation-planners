import SiteHeader from '@/components/SiteHeader';
import Link from 'next/link';
import { requireCustomer } from '@/lib/auth/customer-session';
import './account.css';
import { customerBookings } from '@/lib/booking-service';
import { travelDatabase } from '@/lib/travel/database';
import { money, prettyDate } from '@/features/crm/demo-data';
import '../portal.css';
export const dynamic = 'force-dynamic';
export default async function MyBookings() {
  const user = await requireCustomer();
  const { bookings, payments } = await customerBookings(user.id);
  const travel = travelDatabase();
  const updates = new Map(
    await Promise.all(
      bookings.map(
        async (booking) =>
          [
            booking.id,
            Number(
              (
                await travel.get(
                  'SELECT count(*) count FROM trip_notifications WHERE booking_id=$1 AND is_read=0',
                  booking.id,
                )
              )?.count || 0,
            ),
          ] as const,
      ),
    ),
  );
  return (
    <>
      <SiteHeader />
      <main className="portal-page customer-account-page" id="main-content">
        <div className="customer-bookings-heading">
          <div>
            <span className="customer-account-eyebrow">YOUR TRAVEL COLLECTION</span>
            <h1>
              My bookings<span>.</span>
            </h1>
            <p>Your travel requests and confirmed journeys, all in one place.</p>
          </div>
          <Link href="/packages" className="customer-new-trip">
            Plan a new trip
          </Link>
          <Link href="/customer/travel" className="customer-new-trip">
            My Travel Details
          </Link>
        </div>
        {!bookings.length && (
          <section className="portal-card">
            <h2>Your next journey awaits</h2>
            <p>Choose a package and select Book now to make your first booking request.</p>
          </section>
        )}
        <div className="portal-grid">
          {bookings.map((b) => (
            <article className="portal-card customer-booking-card" key={b.id}>
              <div className="portal-lead-heading">
                <h2>{b.tour}</h2>
                <span className="portal-tag">{b.status}</span>
              </div>
              <small>Reference: {b.id}</small>
              <p>
                <Link href={`/customer/travel/${encodeURIComponent(b.id)}`}>
                  My Travel Details {updates.get(b.id) ? `(${updates.get(b.id)} new updates)` : '→'}
                </Link>
              </p>
              <p>
                {prettyDate(b.travelDate)}
                {b.returnDate ? ' to ' + prettyDate(b.returnDate) : ''} / {b.travelers} travellers
              </p>
              <p>
                Total:{' '}
                <strong>
                  {b.pricingPending ? 'Awaiting price confirmation' : money(b.amount)}
                </strong>
              </p>
              {!b.pricingPending && (
                <p>
                  Paid: {money(b.paid)} ? Balance: {money(b.amount - b.paid)}
                </p>
              )}
              {b.status === 'Pending' && (
                <p>Our team will contact you to confirm availability and the final details.</p>
              )}
              {payments.some((p) => p.bookingId === b.id) && (
                <details>
                  <summary>Payment history</summary>
                  {payments
                    .filter((p) => p.bookingId === b.id)
                    .map((p) => (
                      <p key={p.id}>
                        {prettyDate(p.date)} ? {money(p.amount)} ? {p.method}
                      </p>
                    ))}
                </details>
              )}
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
