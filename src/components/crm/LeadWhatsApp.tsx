'use client';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsappChatUrl } from '@/lib/utils';
import { prettyDate, type Lead } from '@/features/crm/demo-data';
export default function LeadWhatsApp({ lead }: { lead: Lead }) {
  const templates = {
    introduction:
      'Hello ' +
      lead.name +
      ', this is Vacation Planners regarding your ' +
      lead.destination +
      ' enquiry (' +
      lead.id +
      '). How can we help you plan your trip?',
    followup:
      'Hello ' +
      lead.name +
      ', following up on your ' +
      lead.destination +
      ' trip for ' +
      lead.travelers +
      ' traveller(s), planned for ' +
      prettyDate(lead.travelDate) +
      '. Would you like to discuss the itinerary or package options? Regards, Vacation Planners.',
  };
  const [message, setMessage] = useState(templates.introduction);
  const sample = lead.email.toLowerCase().endsWith('.test');
  const href = sample ? null : getWhatsappChatUrl(lead.phone, message);
  return (
    <section style={{ marginBlock: '24px' }}>
      <h3>WhatsApp conversation</h3>
      <p>Recipient: {lead.phone}</p>
      <label className="crm-form-field">
        <span>Message template</span>
        <select
          defaultValue="introduction"
          onChange={(e) => setMessage(templates[e.target.value as keyof typeof templates])}
        >
          <option value="introduction">Introduction</option>
          <option value="followup">Travel follow-up</option>
        </select>
      </label>
      <label className="crm-form-field">
        <span>Review message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
        />
      </label>
      {href && message.trim() ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="crm-btn crm-btn-primary"
        >
          <MessageCircle size={17} /> Open WhatsApp
        </a>
      ) : (
        <button type="button" className="crm-btn crm-btn-light" disabled>
          WhatsApp unavailable
        </button>
      )}
      <p className="crm-chart-note">
        {sample
          ? 'Sample contacts are preview-only.'
          : !href
            ? 'Use a full international phone number, including country code.'
            : 'Review and send the message in WhatsApp. Opening a chat does not confirm delivery.'}{' '}
        Messages and replies are not synced to this demo Admin.
      </p>
    </section>
  );
}
