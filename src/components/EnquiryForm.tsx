'use client';
import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { getWhatsappUrl } from '@/lib/utils';
type Props = { packageName?: string; compact?: boolean };
type FormValues = {
  name: string;
  email: string;
  phone: string;
  destination: string;
  date: string;
  travellers: string;
  message: string;
};
export default function EnquiryForm({ packageName = '', compact = false }: Props) {
  const initial = {
    name: '',
    email: '',
    phone: '',
    destination: packageName,
    date: '',
    travellers: '2',
    message: '',
  };
  const requestKey = useRef('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [values, setValues] = useState<FormValues>(initial);
  const [preview, setPreview] = useState(false);
  const whatsappMessage = `Hi Vacation Planners, I'm interested in ${values.destination || packageName || 'planning a holiday'}. Travellers: ${values.travellers || 'not sure'}. Preferred date: ${values.date || 'flexible'}. ${values.message}`;
  const whatsapp = getWhatsappUrl(whatsappMessage);
  function update(key: keyof FormValues, value: string) {
    requestKey.current = '';
    setError('');
    setValues((old) => ({ ...old, [key]: value }));
    setPreview(false);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey.current },
        body: JSON.stringify({ ...values, packageName }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not submit enquiry.');
      setReference(result.id);
      setPreview(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send enquiry. Please try again.');
    } finally {
      setSending(false);
    }
  }
  return (
    <div className={`enquiry-form-wrapper ${compact ? 'enquiry-compact' : ''}`}>
      {preview ? (
        <div className="form-preview-success" role="status">
          <CheckCircle2 size={34} />
          <h3>Your enquiry has been received.</h3>
          <p>
            Our team will contact you to discuss your trip. Your enquiry reference is{' '}
            <strong>{reference}</strong>.
          </p>
          <div className="form-preview-actions">
            {whatsapp && (
              <a
                className="btn btn-primary"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={17} /> Continue on WhatsApp
              </a>
            )}
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                setValues(initial);
                requestKey.current = '';
                setPreview(false);
              }}
            >
              Send another enquiry
            </button>
          </div>
        </div>
      ) : (
        <form className="enquiry-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Full name <span>*</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Your full name"
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </label>
            <label>
              Phone number <span>*</span>
              <input
                type="tel"
                required
                minLength={7}
                maxLength={20}
                autoComplete="tel"
                placeholder="Your contact number"
                value={values.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </label>
            <label>
              Email address <span>*</span>
              <input
                type="email"
                required
                maxLength={180}
                autoComplete="email"
                placeholder="hello@example.com"
                value={values.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </label>
            <label>
              Destination
              <input
                type="text"
                maxLength={120}
                placeholder="Where would you like to go?"
                value={values.destination}
                onChange={(e) => update('destination', e.target.value)}
              />
            </label>
            <label>
              Preferred travel date
              <input
                type="date"
                value={values.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </label>
            <label>
              Number of travellers
              <input
                type="number"
                min="1"
                max="50"
                value={values.travellers}
                onChange={(e) => update('travellers', e.target.value)}
              />
            </label>
          </div>
          <label className="form-full">
            Tell us about your trip
            <textarea
              rows={compact ? 3 : 5}
              maxLength={2000}
              placeholder="Your ideal trip, special requests or anything we should know..."
              value={values.message}
              onChange={(e) => update('message', e.target.value)}
            />
          </label>
          <button type="submit" disabled={sending} className="btn btn-primary form-submit">
            {sending ? 'Sending...' : 'Send enquiry'} <Send size={17} />
          </button>
          {error && (
            <p role="alert" className="crm-form-error">
              {error}
            </p>
          )}
          <p className="form-disclaimer">
            By submitting, you agree that our team may contact you about this enquiry.
          </p>
        </form>
      )}
    </div>
  );
}
