'use client';
import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useDemo } from '@/features/crm/demo-store';
import { money, prettyDate } from '@/features/crm/demo-data';
export default function BookingDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, setBookingPrice } = useDemo();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const booking = data.bookings.find((b) => b.id === id);
  if (!booking) return null;
  const payments = data.payments.filter((p) => p.bookingId === id);
  async function price(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await setBookingPrice(id, Number(new FormData(e.currentTarget).get('amount')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set price.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="crm-modal-overlay"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <aside
        className="crm-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={'Booking ' + id}
      >
        <button className="crm-modal-x" onClick={onClose} aria-label="Close booking">
          <X size={20} />
        </button>
        <span className="crm-overline">BOOKING DETAILS</span>
        <h2>{booking.tour}</h2>
        <p>
          {booking.id} ? {booking.status}
        </p>
        <div className="crm-drawer-fields">
          {[
            ['Customer', booking.customer],
            ['Email', booking.email || '?'],
            ['Phone', booking.phone || '?'],
            ['Departure', prettyDate(booking.travelDate)],
            ['Return', booking.returnDate ? prettyDate(booking.returnDate) : '?'],
            ['Travellers', String(booking.travelers)],
            ['Booking total', booking.pricingPending ? 'Awaiting price' : money(booking.amount)],
            ['Received', money(booking.paid)],
            [
              'Balance',
              booking.pricingPending ? 'Awaiting price' : money(booking.amount - booking.paid),
            ],
            ['Source', booking.source || 'Admin'],
            [
              'Quotation',
              booking.quoteId ||
                (booking.source === 'Website' ? 'Website booking request' : 'Direct booking'),
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {booking.status !== 'Cancelled' && (
          <form onSubmit={price} className="crm-form-grid">
            <label className="crm-form-field crm-form-full">
              <span>
                {booking.pricingPending
                  ? 'Set final booking total (INR)'
                  : 'Update booking total (INR)'}
              </span>
              <input
                name="amount"
                type="number"
                min={Math.max(1, booking.paid)}
                max="100000000"
                step="1"
                required
                defaultValue={booking.pricingPending ? '' : booking.amount}
                key={booking.amount}
              />
            </label>
            <button className="crm-btn crm-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save price'}
            </button>
            {error && (
              <p role="alert" className="crm-form-error">
                {error}
              </p>
            )}
          </form>
        )}
        <h3>Passengers</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>
          {booking.passengers || 'No passenger names recorded.'}
        </p>
        <h3>Notes</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{booking.notes || 'No notes recorded.'}</p>
        <h3>Payment history</h3>
        {payments.length ? (
          payments.map((p) => (
            <div className="crm-drawer-notes" key={p.id}>
              <strong>{money(p.amount)}</strong>
              <p>
                {p.method} ? {prettyDate(p.date)}
              </p>
              <small>{p.reference}</small>
            </div>
          ))
        ) : (
          <p>No payments recorded.</p>
        )}
        {booking.status === 'Cancelled' && booking.paid > 0 && (
          <p className="crm-form-error">
            This cancelled booking has recorded payments. Handle any refund separately; the payment
            history is retained.
          </p>
        )}
      </aside>
    </div>
  );
}
