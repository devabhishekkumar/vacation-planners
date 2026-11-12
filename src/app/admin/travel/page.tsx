import Link from 'next/link';
import { travelOperator } from '@/lib/travel/operator';
import { bookingSnapshot } from '@/lib/booking-service';
import OperatorAccess from '@/components/travel/OperatorAccess';
import '@/components/travel/travel.css';
export const dynamic = 'force-dynamic';
export default async function TravelWorkspace() {
  if (!(await travelOperator()))
    return (
      <div className="tm-page">
        <OperatorAccess
          configured={Boolean(
            process.env.TRAVEL_ADMIN_KEY && process.env.TRAVEL_ADMIN_KEY.length >= 24,
          )}
        />
      </div>
    );
  const { bookings } = await bookingSnapshot();
  return (
    <div className="tm-page">
      <header className="tm-hero">
        <div>
          <span className="tm-eyebrow">WORKSPACE / TRIP MANAGEMENT</span>
          <h1>Every detail, taken care of.</h1>
          <p>Manage transport, stays, transfers, meals and the day-wise plan for each booking.</p>
        </div>
      </header>
      {!bookings.length ? (
        <div className="tm-empty">
          <h2>No trips yet</h2>
          <p>Your bookings will appear here when a customer requests a holiday.</p>
          <Link className="tm-button" href="/admin/bookings">
            View bookings
          </Link>
        </div>
      ) : (
        <div className="tm-card-grid">
          {bookings.map((b) => (
            <article className="tm-card tm-booking-link" key={b.id}>
              <span className={`tm-status tm-${b.status.toLowerCase()}`}>{b.status}</span>
              <h2>{b.tour}</h2>
              <p>
                {b.customer} · {b.travelers} travellers
              </p>
              <p className="tm-muted">
                {b.id} · {b.travelDate}
                {b.returnDate ? ` → ${b.returnDate}` : ''}
              </p>
              <Link className="tm-button" href={`/admin/travel/${encodeURIComponent(b.id)}`}>
                Manage Travel →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
