'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  serviceKinds,
  serviceDefinitions,
  serviceTitle,
  type ServiceKind,
  type TravelSnapshot,
  type TravelService,
} from '@/features/travel/types';
import { getWhatsappChatUrl } from '@/lib/utils';
import ServiceForm from './ServiceForm';
import ItineraryBuilder, { ItineraryTimeline } from './ItineraryBuilder';
export default function TravelManager({
  bookingId,
  admin = false,
}: {
  bookingId: string;
  admin?: boolean;
}) {
  const router = useRouter();
  const [trip, setTrip] = useState<TravelSnapshot | null>(null),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ServiceKind | 'itinerary' | 'support'>('transport');
  const [editor, setEditor] = useState<TravelService | 'new' | null>(null);
  const endpoint = `/api/travel/${encodeURIComponent(bookingId)}`;
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(endpoint, { cache: 'no-store', signal });
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        if (!signal?.aborted) {
          setTrip(result);
          setError('');
        }
      } catch (e) {
        if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Could not load trip.');
      }
    },
    [endpoint],
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        if (!controller.signal.aborted) {
          setTrip(result);
          setError('');
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : 'Could not load trip.');
      });
    const timer = admin
      ? undefined
      : window.setInterval(() => {
          void load(controller.signal);
        }, 15000);
    return () => {
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [load, admin, endpoint]);
  async function save(body: Record<string, unknown> | FormData): Promise<boolean> {
    if (!trip || busy) return false;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(
        endpoint,
        body instanceof FormData
          ? { method: 'POST', body }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...body, revision: trip.revision }),
            },
      );
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setTrip(result);
      setSuccess(
        body instanceof FormData
          ? 'Document uploaded. Confirm the arrangement to make it available to the customer.'
          : body.operation === 'itinerary-save'
            ? 'Private itinerary draft saved. Publish it when ready to share.'
            : body.operation === 'notices-read'
              ? 'Travel updates marked as read.'
              : 'Travel details saved. The customer dashboard is up to date.',
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save travel details.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(serviceId: string, file: File) {
    if (!trip) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Documents must be no larger than 8 MB.');
      return;
    }
    const form = new FormData();
    form.set('file', file);
    form.set('serviceId', serviceId);
    form.set('revision', String(trip.revision));
    await save(form);
  }
  async function logout() {
    try {
      const response = await fetch('/api/travel/session', { method: 'DELETE' });
      if (!response.ok) throw Error('Could not sign out.');
      router.push('/admin/travel');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign out.');
    }
  }
  if (!trip)
    return (
      <div className="tm-page">
        <Link href={admin ? '/admin/travel' : '/customer/travel'}>← Back to trips</Link>
        {error ? (
          <div className="tm-card">
            <p className="tm-error" role="alert">
              {error}
            </p>
            <button className="tm-button" onClick={() => void load()}>
              Retry
            </button>
            {admin && <Link href="/admin/travel">Operator sign-in</Link>}
          </div>
        ) : (
          <p role="status" className="tm-empty">
            Loading your travel details…
          </p>
        )}
      </div>
    );
  const editable = admin && trip.admin && trip.booking.status !== 'Cancelled';
  const services = trip.services.filter((service) => service.kind === tab);
  const tabs = [
    ...serviceKinds.map((kind) => ({ key: kind, label: serviceDefinitions[kind].label })),
    { key: 'itinerary', label: 'Day-wise itinerary' },
    { key: 'support', label: 'Travel support' },
  ];
  const unread = trip.notifications.filter((n) => !n.read).length;
  return (
    <div className="tm-page">
      <div className="tm-breadcrumb">
        <Link href={admin ? '/admin/travel' : '/customer/travel'}>
          ← {admin ? 'Trip management' : 'My travel details'}
        </Link>
        <div className="tm-actions">
          <button
            className="tm-button tm-secondary"
            disabled={busy}
            onClick={() => {
              if (
                !admin ||
                window.confirm('Reload saved trip details? Unsaved form changes will be discarded.')
              ) {
                setTrip(null);
                setEditor(null);
                void load();
              }
            }}
          >
            Refresh
          </button>
          {admin && (
            <button className="tm-button tm-secondary" onClick={() => void logout()}>
              Sign out of travel
            </button>
          )}
        </div>
      </div>
      <header className="tm-hero">
        <div>
          <span className="tm-eyebrow">
            {admin ? 'POST-BOOKING OPERATIONS' : 'YOUR HOLIDAY, ALL TOGETHER'}
          </span>
          <h1>{trip.booking.tour}</h1>
          <p>
            {trip.booking.customer} · {trip.booking.id}
          </p>
          <p>
            {trip.booking.travelDate}
            {trip.booking.returnDate ? ` → ${trip.booking.returnDate}` : ''} ·{' '}
            {trip.booking.travelers} travellers
          </p>
        </div>
        <div className="tm-hero-status">
          <span className={`tm-status tm-${trip.booking.status.toLowerCase()}`}>
            {trip.booking.status}
          </span>
          <p>
            {trip.services.filter((s) => s.status === 'Confirmed').length} / {trip.services.length}{' '}
            arrangements confirmed
          </p>
          {admin && !trip.booking.customerId && (
            <p>
              This booking is not linked to a customer account. Customer access requires the
              existing booking customer ID.
            </p>
          )}
        </div>
      </header>
      {error && (
        <p role="alert" className="tm-error tm-card">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="tm-success">
          {success}
        </p>
      )}
      {trip.booking.status === 'Cancelled' && (
        <p className="tm-error">
          This booking is cancelled. Travel arrangements are shown for reference and cannot be
          edited.
        </p>
      )}
      {!admin && trip.notifications.length > 0 && (
        <details className="tm-card tm-notices" open={unread > 0}>
          <summary>Travel updates {unread > 0 ? `(${unread} unread)` : ''}</summary>
          <ul>
            {trip.notifications.map((n) => (
              <li key={n.id}>
                <strong>{n.message}</strong>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
          {unread > 0 && (
            <button
              className="tm-button tm-secondary"
              disabled={busy}
              onClick={() => void save({ operation: 'notices-read' })}
            >
              Mark updates as read
            </button>
          )}
        </details>
      )}
      <nav className="tm-tabs" aria-label="Travel service sections">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.key}
            aria-current={tab === item.key ? 'page' : undefined}
            onClick={() => {
              if (editor && !window.confirm('Discard unsaved arrangement changes?')) return;
              setTab(item.key as typeof tab);
              setEditor(null);
            }}
          >
            {item.label}
            {serviceKinds.includes(item.key as ServiceKind) && (
              <small>{trip.services.filter((s) => s.kind === item.key).length}</small>
            )}
          </button>
        ))}
      </nav>
      {serviceKinds.includes(tab as ServiceKind) && (
        <>
          <div className="tm-section-heading">
            <div>
              <h2>{serviceDefinitions[tab as ServiceKind].label}</h2>
              <p>Every arrangement has its own confirmation status.</p>
            </div>
            {editable && !editor && (
              <button className="tm-button" disabled={busy} onClick={() => setEditor('new')}>
                + Add arrangement
              </button>
            )}
          </div>
          {editor && editable && (
            <ServiceForm
              key={editor === 'new' ? 'new' : editor.id}
              kind={tab as ServiceKind}
              service={editor === 'new' ? undefined : editor}
              busy={busy}
              onSave={save}
              onCancel={() => setEditor(null)}
            />
          )}
          {!services.length && !editor && (
            <div className="tm-empty">
              <h3>No arrangements yet</h3>
              <p>
                {admin
                  ? 'Add the first service for this trip.'
                  : 'Your travel team is arranging these details. Check back soon.'}
              </p>
              <span className="tm-status tm-pending">Pending</span>
            </div>
          )}
          <div className="tm-card-grid">
            {services.map((service) => (
              <article className="tm-card" key={service.id}>
                <div className="tm-card-heading">
                  <span className="tm-service-icon">{serviceDefinitions[service.kind].icon}</span>
                  <span className={`tm-status tm-${service.status.toLowerCase()}`}>
                    {service.status}
                  </span>
                </div>
                <h3>{serviceTitle(service)}</h3>
                <dl>
                  {serviceDefinitions[service.kind].fields
                    .filter((field) => service.fields[field.key])
                    .map((field) => (
                      <div key={field.key}>
                        <dt>{field.label}</dt>
                        <dd>{service.fields[field.key]}</dd>
                      </div>
                    ))}
                </dl>
                {service.fields.notes && <p className="tm-notes">{service.fields.notes}</p>}
                {service.status !== 'Confirmed' && (
                  <p className="tm-muted">
                    {service.status === 'Cancelled'
                      ? 'This arrangement is cancelled.'
                      : 'These details are not confirmed. Tickets and vouchers become available once confirmed.'}
                  </p>
                )}
                <div className="tm-documents">
                  {trip.documents
                    .filter((doc) => doc.serviceId === service.id)
                    .map((doc) => (
                      <div key={doc.id}>
                        <a
                          href={`/api/travel/documents/${encodeURIComponent(doc.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ↓ {doc.name} <small>({Math.ceil(doc.size / 1024)} KB)</small>
                        </a>
                        {editable && (
                          <button
                            className="tm-text-button"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm('Delete this private document?'))
                                void save({ operation: 'document-delete', id: doc.id });
                            }}
                          >
                            Delete document
                          </button>
                        )}
                      </div>
                    ))}
                </div>
                {editable && (
                  <>
                    <div className="tm-actions">
                      <button
                        className="tm-button tm-secondary"
                        disabled={busy}
                        onClick={() => setEditor(service)}
                      >
                        Edit
                      </button>
                      <button
                        className="tm-button"
                        disabled={
                          busy || service.status === 'Confirmed' || service.status === 'Cancelled'
                        }
                        onClick={() => void save({ operation: 'service-confirm', id: service.id })}
                      >
                        Confirm
                      </button>
                      <button
                        className="tm-button tm-danger"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm('Delete this arrangement and its documents?'))
                            void save({ operation: 'service-delete', id: service.id });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <label className="tm-upload">
                      Upload ticket / voucher <small>PDF, PNG or JPEG · up to 8 MB</small>
                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void upload(service.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {tab === 'itinerary' && (
        <>
          <div className="tm-section-heading">
            <div>
              <h2>Your day-wise plan</h2>
              <p>
                {trip.publishedAt
                  ? `Last published ${new Date(trip.publishedAt).toLocaleString()}`
                  : 'Not yet published'}
              </p>
            </div>
            {trip.publishedAt && (
              <a className="tm-button tm-secondary" href={`${endpoint}/itinerary`}>
                ↓ Download itinerary PDF
              </a>
            )}
          </div>
          {editable ? (
            <ItineraryBuilder
              key={trip.revision}
              initial={trip.itinerary}
              busy={busy}
              onSave={save}
            />
          ) : (
            <div className="tm-card">
              <ItineraryTimeline activities={trip.itinerary} />
            </div>
          )}
        </>
      )}
      {tab === 'support' && (
        <section className="tm-card">
          <h2>Your travel coordinator</h2>
          {editable ? (
            <form
              key={trip.revision}
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void save({
                  operation: 'coordinator',
                  coordinator: {
                    name: form.get('name'),
                    phone: form.get('phone'),
                    email: form.get('email'),
                  },
                });
              }}
            >
              <div className="tm-form-grid">
                <label>
                  Name
                  <input name="name" maxLength={120} defaultValue={trip.coordinator.name} />
                </label>
                <label>
                  Phone
                  <input
                    name="phone"
                    type="tel"
                    maxLength={28}
                    defaultValue={trip.coordinator.phone}
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    maxLength={254}
                    defaultValue={trip.coordinator.email}
                  />
                </label>
              </div>
              <button className="tm-button" disabled={busy}>
                Save coordinator
              </button>
            </form>
          ) : (
            <>
              <h3>{trip.coordinator.name || 'Your coordinator will be assigned soon'}</h3>
              {trip.coordinator.phone && (
                <p>
                  <a href={`tel:${trip.coordinator.phone.replace(/[^+\d]/g, '')}`}>
                    {trip.coordinator.phone}
                  </a>
                </p>
              )}
              {trip.coordinator.email && (
                <p>
                  <a href={`mailto:${trip.coordinator.email}`}>{trip.coordinator.email}</a>
                </p>
              )}
            </>
          )}
          {admin && (
            <div className="tm-share">
              <h3>Share an update</h3>
              <p>
                Dashboard updates and travel notifications are automatic. WhatsApp opens a prepared
                message for you to review and send.
              </p>
              <button
                className="tm-button tm-secondary"
                disabled={!getWhatsappChatUrl(trip.booking.phone || '', 'Update')}
                onClick={() => {
                  const link = getWhatsappChatUrl(
                    trip.booking.phone || '',
                    `Hello ${trip.booking.customer}, your travel details for ${trip.booking.tour} (${trip.booking.id}) have been updated. Sign in to view your arrangements: ${window.location.origin}/customer/travel/${encodeURIComponent(trip.booking.id)}`,
                  );
                  if (link) window.open(link, '_blank', 'noopener,noreferrer');
                }}
              >
                Open traveller WhatsApp
              </button>
              <p className="tm-muted">
                WhatsApp requires an international customer phone number. Automatic email / WhatsApp
                delivery is not configured in this project.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
