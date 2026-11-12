'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, CalendarDays, Users } from 'lucide-react';
import { getWhatsappUrl } from '@/lib/utils';
type Props = {
  packageSlug: string;
  packageName: string;
  duration: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
};
export default function WebsiteBookingForm({
  packageSlug,
  packageName,
  duration,
  customerName,
  customerEmail,
  customerPhone,
}: Props) {
  const [loginUrl, setLoginUrl] = useState('');
  const [sending, setSending] = useState(false),
    [error, setError] = useState(''),
    [reference, setReference] = useState(''),
    [departure, setDeparture] = useState(''),
    [minimum, setMinimum] = useState('');
  const key = useRef('');
  const form = useRef<HTMLFormElement>(null);
  const draftKey = 'vp-booking-draft:' + packageSlug + ':' + customerEmail;
  useEffect(() => {
    setMinimum(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
    );
  }, []);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const values = JSON.parse(raw) as Record<string, string>;
        for (const name of [
          'customer',
          'phone',
          'travelers',
          'returnDate',
          'passengers',
          'notes',
        ]) {
          const field = form.current?.elements.namedItem(name);
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
            field.value = String(values[name] || '');
        }
        if (values.travelDate) setDeparture(String(values.travelDate));
      }
    } catch {}
  }, [draftKey]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const f = new FormData(e.currentTarget);
    setSending(true);
    setError('');
    try {
      if (!key.current) key.current = crypto.randomUUID();
      const response = await fetch('/api/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key.current },
        body: JSON.stringify({
          packageSlug,
          customer: f.get('customer'),
          email: f.get('email'),
          phone: f.get('phone'),
          travelDate: f.get('travelDate'),
          returnDate: f.get('returnDate'),
          travelers: Number(f.get('travelers')),
          passengers: f.get('passengers'),
          notes: f.get('notes'),
        }),
      });
      const result = await response.json();
      if (response.status === 401) setLoginUrl(result.loginUrl || '/login/customer');
      if (!response.ok) throw Error(result.error || 'Could not submit your booking request.');
      setLoginUrl('');
      setReference(result.id);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit. Please try again.');
    } finally {
      setSending(false);
    }
  }
  const whatsapp = getWhatsappUrl(
    'Hello Vacation Planners, I submitted booking request ' +
      reference +
      ' for ' +
      packageName +
      '. Please help me with availability and pricing.',
  );
  if (reference)
    return (
      <div className="website-booking-success" role="status">
        <CheckCircle2 size={44} />
        <span className="eyebrow">REQUEST RECEIVED</span>
        <h3>Your next journey starts here.</h3>
        <p>
          Your booking reference is <strong>{reference}</strong>.
        </p>
        <div className="website-booking-summary">
          <strong>{packageName}</strong>
          <span>Status: Pending confirmation</span>
        </div>
        <p>
          Our team will contact you to confirm availability, the final price and payment details.
          Your trip is not confirmed yet, and no payment has been collected.
        </p>
        <Link href="/customer" className="btn btn-outline">
          View my bookings
        </Link>
        {whatsapp && (
          <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">
            Discuss on WhatsApp <ArrowRight size={16} />
          </a>
        )}
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => {
            key.current = '';
            setReference('');
            setDeparture('');
          }}
        >
          Make another booking request
        </button>
      </div>
    );
  return (
    <form
      ref={form}
      className="enquiry-form website-booking-form"
      onSubmit={submit}
      onChange={(e) => {
        key.current = '';
        setError('');
        try {
          sessionStorage.setItem(
            draftKey,
            JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries())),
          );
        } catch {}
      }}
    >
      <div className="website-booking-summary">
        <strong>{packageName}</strong>
        <span>
          <CalendarDays size={16} /> {duration} <Users size={16} /> Private travel planning
        </span>
        <small>Final price and availability will be confirmed by our team.</small>
      </div>
      <div className="form-grid">
        <label>
          Full name <span>*</span>
          <input
            name="customer"
            autoComplete="name"
            required
            minLength={2}
            maxLength={90}
            placeholder="Lead traveller's name"
            defaultValue={customerName}
          />
        </label>
        <label>
          Phone number <span>*</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={28}
            placeholder="Your contact number"
            defaultValue={customerPhone || ''}
          />
        </label>
        <label>
          Email address <span>*</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
            defaultValue={customerEmail}
            readOnly
          />
        </label>
        <label>
          Travellers <span>*</span>
          <input name="travelers" type="number" min="1" max="50" defaultValue="2" required />
        </label>
        <label>
          Departure date <span>*</span>
          <input
            name="travelDate"
            type="date"
            required
            min={minimum || undefined}
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </label>
        <label>
          Preferred return date
          <input name="returnDate" type="date" min={departure || minimum || undefined} />
        </label>
      </div>
      <label className="form-full">
        Passenger names <small>(optional)</small>
        <textarea
          name="passengers"
          rows={3}
          maxLength={3000}
          placeholder="One passenger name per line"
        />
      </label>
      <label className="form-full">
        Special requests <small>(optional)</small>
        <textarea
          name="notes"
          rows={3}
          maxLength={3000}
          placeholder="Hotel preferences, room arrangements or anything we should know"
        />
      </label>
      <p className="form-disclaimer">
        Submit your request and our team will contact you with availability and a final price. No
        online payment is required. By submitting, you agree to be contacted about this booking.
      </p>
      {error && (
        <p className="website-booking-error" role="alert">
          {error} {loginUrl && <Link href={loginUrl}>Sign in to continue</Link>}
        </p>
      )}
      <button type="submit" disabled={sending} className="btn btn-primary form-submit">
        {sending ? 'Submitting...' : 'Request booking'} <ArrowRight size={17} />
      </button>
    </form>
  );
}
