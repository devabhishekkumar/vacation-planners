'use client';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Download, MessageCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { getWhatsappChatUrl } from '@/lib/utils';
import { useDemo } from '@/features/crm/demo-store';
import { todayISO } from '@/features/crm/demo-data';
import {
  itemPrice,
  itemTotal,
  quotationTotals,
  quotationPdf,
  type QuotationDetails,
  type QuotationItem,
} from '@/features/crm/quotation';

const blankItem = (): QuotationItem => ({
  id: crypto.randomUUID(),
  group: '',
  hsn: '',
  quantity: 1,
  unit: 'Package',
  description: '',
  price: 0,
  discount: 0,
});
const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`crm-form-field ${full ? 'crm-form-full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export default function QuotationForm({ onClose }: { onClose: () => void }) {
  const store = useDemo();
  const [leadId, setLeadId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState<QuotationDetails | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [details, setDetails] = useState<QuotationDetails>(() => {
    const date = todayISO();
    const prefix = `LD-QTN-${date.replaceAll('-', '')}-`;
    const sequence =
      Math.max(
        0,
        ...store.data.quotations
          .filter((q) => q.id.startsWith(prefix))
          .map((q) => Number(q.id.slice(prefix.length)) || 0),
      ) + 1;
    return {
      kind: 'travel',
      destination: '',
      departure: '',
      returnDate: '',
      travelers: 2,
      inclusions: '',
      exclusions: '',
      number: prefix + String(sequence).padStart(3, '0'),
      date,
      validity: 5,
      buyerRef: '',
      paymentTerms: 'As agreed at booking',
      dispatch: '',
      incoterms: '',
      deliveryTerms: '',
      company: '',
      contact: '',
      address1: '',
      address2: '',
      email: '',
      phone: '',
      cgst: 0,
      sgst: 0,
      terms:
        'Prices are subject to availability at the time of booking.\nYour booking is confirmed only after payment and written confirmation.\nCancellation and refund conditions will be shared before booking.',
      gstin: '',
      cin: '',
      pan: '',
      sellerAddress: '',
      sellerPhone: '',
      sellerEmail: '',
      bank: '',
      items: [blankItem()],
    };
  });
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose, saving]);
  const totals = quotationTotals(details);
  const update = <K extends keyof QuotationDetails>(key: K, value: QuotationDetails[K]) =>
    setDetails((previous) => ({ ...previous, [key]: value }));
  const updateItem = (id: string, changes: Partial<QuotationItem>) =>
    update(
      'items',
      details.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  const input = (
    key: keyof QuotationDetails,
    label: string,
    placeholder = '',
    required = false,
    type = 'text',
  ) => (
    <Field label={label}>
      <input
        type={type}
        value={String(details[key] ?? '')}
        placeholder={placeholder}
        required={required}
        maxLength={250}
        onChange={(event) => update(key, event.target.value as never)}
      />
    </Field>
  );
  const results = store.data.leads.filter(
    (lead) =>
      lead.status !== 'Lost' &&
      `${lead.id} ${lead.name} ${lead.email} ${lead.phone} ${lead.destination}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!downloaded && store.data.quotations.some((quote) => quote.id === details.number.trim())) {
      setError('This quotation number already exists. Enter a unique number.');
      return;
    }
    if (
      details.items.some(
        (item) =>
          !item.description.trim() ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.price) ||
          item.price < 0 ||
          !Number.isFinite(item.discount) ||
          item.discount < 0 ||
          item.discount > item.price,
      )
    ) {
      setError(
        'Each trip cost needs a description, positive quantity, and a discount between zero and its unit price.',
      );
      return;
    }
    setSaving(true);
    try {
      const normalized = {
        ...details,
        number: details.number.trim(),
        company: details.company.trim(),
      };
      if (!normalized.company || !normalized.number)
        throw Error('Enter a quotation number and traveller name.');
      const validUntil = new Date(`${details.date}T12:00:00`);
      validUntil.setDate(validUntil.getDate() + details.validity);
      const bytes = quotationPdf(normalized);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      try {
        if (!downloaded)
          await store.addQuotation({
            leadId,
            title: (details.destination
              ? `${details.destination} holiday`
              : details.items[0].description
            ).slice(0, 120),
            amount: totals.total,
            validUntil: `${validUntil.getFullYear()}-${String(validUntil.getMonth() + 1).padStart(2, '0')}-${String(validUntil.getDate()).padStart(2, '0')}`,
            details: normalized,
          });
        const link = document.createElement('a');
        link.href = url;
        link.download = `${normalized.number.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (failure) {
        URL.revokeObjectURL(url);
        throw failure;
      }
      setDownloaded(normalized);
      setWhatsappPhone(normalized.phone);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save quotation.');
    } finally {
      setSaving(false);
    }
  }
  const whatsappDetails = downloaded || details;
  const whatsappMessage = `Hello ${whatsappDetails.company}, here is your holiday quotation ${whatsappDetails.number}${whatsappDetails.destination ? ` for ${whatsappDetails.destination}` : ''}. Total: ${money(quotationTotals(whatsappDetails).total)}. Valid for ${whatsappDetails.validity} days. Please find the quotation PDF attached. ? Vacation Planners`;
  const whatsapp = getWhatsappChatUrl(downloaded ? whatsappPhone : details.phone, whatsappMessage);
  return (
    <div
      className="crm-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="crm-modal crm-quotation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quotation-form-title"
      >
        <div className="crm-modal-head">
          <div>
            <span className="crm-overline">Admin WORKSPACE / NEW RECORD</span>
            <h2 id="quotation-form-title">Create holiday quotation</h2>
            <p>
              Build your quotation, save a draft and download a PDF. Drafts are saved in this
              browser.
            </p>
          </div>
          <button
            type="button"
            className="crm-modal-x"
            disabled={saving}
            aria-label="Close quotation"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="crm-modal-body">
            {downloaded && (
              <p role="status">
                PDF download started. Click WhatsApp, attach the downloaded PDF, then send.
              </p>
            )}
            <fieldset
              disabled={saving || Boolean(downloaded)}
              style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
            >
              <div className="crm-record-search">
                <label className="crm-searchbox">
                  <Search size={18} />
                  <input
                    type="search"
                    aria-label="Search enquiries to fill traveller details"
                    placeholder="Search enquiry by name, phone, email or ID..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.preventDefault();
                    }}
                  />
                </label>
                {search.trim() && (
                  <div className="crm-record-search-results">
                    <p role="status">{results.length} matching enquiries</p>
                    {results.slice(0, 8).map((lead) => (
                      <button
                        className="crm-quotation-search-result"
                        type="button"
                        key={lead.id}
                        onClick={() => {
                          setLeadId(lead.id);
                          setDetails((previous) => ({
                            ...previous,
                            company: lead.name,
                            destination: lead.destination,
                            departure: lead.travelDate,
                            travelers: lead.travelers,
                            email: lead.email,
                            phone: lead.phone,
                          }));
                          setSearch('');
                        }}
                      >
                        <strong>{lead.name}</strong>
                        <span>
                          {lead.id} · {lead.destination} · {lead.email}
                        </span>
                      </button>
                    ))}
                    {!results.length && (
                      <p>No matching enquiries. You can enter traveller details below.</p>
                    )}
                  </div>
                )}
                {leadId && (
                  <p className="crm-form-helper">
                    Linked enquiry: {leadId}{' '}
                    <button
                      type="button"
                      className="crm-table-action"
                      onClick={() => setLeadId('')}
                    >
                      Unlink
                    </button>
                  </p>
                )}
              </div>
              <section className="crm-quotation-section">
                <h3>Quotation Details</h3>
                <div className="crm-form-grid">
                  {input('number', 'Quotation No.', '', true)}
                  {input('date', 'Date', '', true, 'date')}
                  <Field label="Validity (days)">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      value={details.validity}
                      onChange={(event) => update('validity', Number(event.target.value))}
                    />
                  </Field>
                  {input('paymentTerms', 'Payment Terms')}
                </div>
              </section>
              <section className="crm-quotation-section">
                <h3>Traveller Details</h3>
                <div className="crm-form-grid">
                  {input('company', 'Traveller Name *', '', true)}

                  {input('address1', 'Address Line 1')}
                  {input('address2', 'Address Line 2 (City, State, Pincode)')}
                  {input('email', 'Email', '', false, 'email')}
                  {input('phone', 'Phone', '', false, 'tel')}
                </div>
              </section>
              <section className="crm-quotation-section">
                <h3>Your Holiday</h3>
                <div className="crm-form-grid">
                  {input('destination', 'Destination *', 'e.g. Goa, Kashmir or Bali', true)}
                  <Field label="Number of travellers">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={details.travelers}
                      onChange={(event) => update('travelers', Number(event.target.value))}
                    />
                  </Field>
                  {input('departure', 'Departure date', '', false, 'date')}
                  <Field label="Return date">
                    <input
                      type="date"
                      min={details.departure || undefined}
                      value={details.returnDate || ''}
                      onChange={(event) => update('returnDate', event.target.value)}
                    />
                  </Field>
                </div>
              </section>
              <section className="crm-quotation-section">
                <h3>Trip Costs</h3>
                {details.items.map((item, index) => (
                  <div className="crm-quotation-item" key={item.id}>
                    <div className="crm-quotation-item-head">
                      <h4>Trip cost {index + 1}</h4>
                      <button
                        type="button"
                        className="crm-table-action"
                        disabled={details.items.length === 1}
                        aria-label={`Remove trip cost ${index + 1}`}
                        onClick={() =>
                          update(
                            'items',
                            details.items.filter((value) => value.id !== item.id),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="crm-form-grid">
                      <Field label="Qty">
                        <input
                          type="number"
                          min="0.01"
                          max="1000000"
                          step="0.01"
                          required
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, { quantity: Number(event.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Unit">
                        <select
                          value={item.unit}
                          onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                        >
                          {['Package', 'Person', 'Room', 'Night', 'Day', 'Vehicle', 'Trip'].map(
                            (unit) => (
                              <option key={unit}>{unit}</option>
                            ),
                          )}
                        </select>
                      </Field>
                      <Field label="Travel service / package *" full>
                        <textarea
                          required
                          maxLength={4000}
                          rows={3}
                          placeholder="Product name and specifications…"
                          value={item.description}
                          onChange={(event) =>
                            updateItem(item.id, { description: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Unit Price (₹)">
                        <input
                          type="number"
                          min="0"
                          max="1000000000"
                          step="0.01"
                          required
                          value={item.price}
                          onChange={(event) =>
                            updateItem(item.id, { price: Number(event.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Discount per unit (₹)">
                        <input
                          type="number"
                          min="0"
                          max={item.price}
                          step="0.01"
                          required
                          value={item.discount}
                          onChange={(event) =>
                            updateItem(item.id, { discount: Number(event.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Discounted Price (₹)">
                        <output>{money(itemPrice(item))}</output>
                      </Field>
                      <Field label="Total (₹)">
                        <output>{money(itemTotal(item))}</output>
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="crm-btn crm-btn-light"
                  onClick={() => update('items', [...details.items, blankItem()])}
                >
                  <Plus size={16} /> Add trip cost
                </button>
                <div className="crm-quotation-totals" aria-live="polite">
                  <p>
                    <span>Sub Total</span>
                    <strong>{money(totals.subtotal)}</strong>
                  </p>
                  <p>
                    <span>CGST ({details.cgst}%)</span>
                    <strong>{money(totals.cgst)}</strong>
                  </p>
                  <p>
                    <span>SGST ({details.sgst}%)</span>
                    <strong>{money(totals.sgst)}</strong>
                  </p>
                  <p className="crm-quotation-grand">
                    <span>Grand Total</span>
                    <strong>{money(totals.total)}</strong>
                  </p>
                </div>
                <details>
                  <summary>Optional taxes</summary>
                  <div className="crm-form-grid">
                    {(['cgst', 'sgst'] as const).map((key) => (
                      <Field key={key} label={`${key.toUpperCase()} %`}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          value={details[key]}
                          onChange={(event) => update(key, Number(event.target.value))}
                        />
                      </Field>
                    ))}
                  </div>
                </details>
              </section>
              <section className="crm-quotation-section">
                <h3>What is included?</h3>
                <Field label="Inclusions">
                  <textarea
                    rows={3}
                    placeholder="Hotel, meals, transfers, sightseeing..."
                    value={details.inclusions || ''}
                    onChange={(event) => update('inclusions', event.target.value)}
                  />
                </Field>
              </section>
              <section className="crm-quotation-section">
                <h3>What is not included?</h3>
                <Field label="Exclusions">
                  <textarea
                    rows={3}
                    placeholder="Flights, personal expenses, optional activities..."
                    value={details.exclusions || ''}
                    onChange={(event) => update('exclusions', event.target.value)}
                  />
                </Field>
              </section>
              <section className="crm-quotation-section">
                <h3>Terms &amp; Conditions</h3>
                <Field label="Terms">
                  <textarea
                    rows={7}
                    maxLength={12000}
                    value={details.terms}
                    onChange={(event) => update('terms', event.target.value)}
                  />
                </Field>
                <p className="crm-form-helper">
                  Each line will be numbered as a separate point in the PDF.
                </p>
              </section>
              <label className="crm-quotation-email">
                <input type="checkbox" disabled /> Also send quotation via email
              </label>
              <p className="crm-form-helper">
                Email delivery is unavailable until a mail service is configured. Download the PDF
                to share it manually.
              </p>
            </fieldset>
            {downloaded && (
              <Field label="Traveller WhatsApp number (with country code)">
                <input
                  type="tel"
                  value={whatsappPhone}
                  maxLength={28}
                  placeholder="e.g. +91 98765 43210"
                  onChange={(event) => setWhatsappPhone(event.target.value)}
                />
              </Field>
            )}
            <p className="crm-form-helper">
              Download the PDF first, then use WhatsApp to open the traveller?s chat. Attach the PDF
              manually before sending. Include the country code in the traveller?s phone number.
            </p>
            {error && (
              <p className="crm-form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="crm-modal-footer">
            <button
              type="button"
              className="crm-btn crm-btn-light"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn crm-btn-primary"
              disabled={saving || Boolean(leadId && !store.leadsReady)}
            >
              <Download size={16} />
              {saving ? 'Saving...' : 'Download PDF'}
            </button>
            {downloaded && whatsapp ? (
              <a
                className="crm-btn crm-btn-primary"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            ) : (
              <button
                type="button"
                className="crm-btn crm-btn-primary"
                disabled
                title="Download the PDF first and enter a valid traveller phone number with country code"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
