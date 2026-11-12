import SiteHeader from '@/components/SiteHeader';
import Link from 'next/link';
import { requireCustomer } from '@/lib/auth/customer-session';
import { customerBookings } from '@/lib/booking-service';
import { travelDatabase } from '@/lib/travel/database';
import '@/components/travel/travel.css';
export const dynamic = 'force-dynamic';
export default async function MyTravel() {
  const user = await requireCustomer('/customer/travel');
  const { bookings } = await customerBookings(user.id);
  const d = travelDatabase();
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="tm-customer-shell">
        <div className="tm-page">
          <Link href="/customer">← My bookings</Link>
          <header className="tm-hero">
            <div>
              <span className="tm-eyebrow">YOUR HOLIDAY COLLECTION</span>
              <h1>My Travel Details</h1>
              <p>Tickets, stays, transfers and your daily itinerary, together in one place.</p>
            </div>
          </header>
          {!bookings.length ? (
            <div className="tm-empty">
              <h2>Your next adventure awaits</h2>
              <p>Once you book a holiday, its travel details will appear here.</p>
              <Link className="tm-button" href="/packages">
                Find a holiday
              </Link>
            </div>
          ) : (
            <div className="tm-card-grid">
              {bookings.map(async (b) => {
                const count = await d.get(
                  'SELECT count(*) count FROM trip_notifications WHERE booking_id=$1 AND is_read=0',
                  b.id,
                );
                return (
                  <article className="tm-card tm-booking-link" key={b.id}>
                    <span className={`tm-status tm-${b.status.toLowerCase()}`}>{b.status}</span>
                    <h2>{b.tour}</h2>
                    <p>
                      {b.travelDate}
                      {b.returnDate ? ` → ${b.returnDate}` : ''}
                    </p>
                    <p className="tm-muted">
                      {b.id} · {b.travelers} travellers
                    </p>
                    {Number(count?.count) > 0 && <p>{Number(count?.count)} new travel updates</p>}
                    <Link
                      className="tm-button"
                      href={`/customer/travel/${encodeURIComponent(b.id)}`}
                    >
                      View travel details →
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
