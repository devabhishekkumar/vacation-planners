'use client';
import { useState, type FormEvent } from 'react';
import {
  arrangementStatuses,
  serviceDefinitions,
  type ServiceKind,
  type TravelService,
} from '@/features/travel/types';
export default function ServiceForm({
  kind,
  service,
  busy,
  onSave,
  onCancel,
}: {
  kind: ServiceKind;
  service?: TravelService;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const definition = serviceDefinitions[kind];
  const [fields, setFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      [...definition.fields, { key: 'notes' }].map((field) => [
        field.key,
        service?.fields[field.key] || ('options' in field ? field.options?.[0] : '') || '',
      ]),
    ),
  );
  const [status, setStatus] = useState(
    service?.status === 'Confirmed' ? 'Changed' : service?.status || 'Pending',
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onSave({ operation: 'service-save', id: service?.id, kind, status, fields }))
      onCancel();
  }
  return (
    <form className="tm-card tm-editor" onSubmit={submit}>
      <h3>
        {service ? 'Edit' : 'Add'} {definition.label.toLowerCase()}
      </h3>
      <p className="tm-muted">
        Save your arrangement first. Use Confirm once booking details and documents are ready.
      </p>
      <div className="tm-form-grid">
        {definition.fields.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.required ? ' *' : ''}
            {field.type === 'select' ? (
              <select
                value={fields[field.key]}
                onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
              >
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                required={field.required}
                maxLength={250}
                value={fields[field.key]}
                onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
              />
            )}
          </label>
        ))}
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {arrangementStatuses
              .filter((value) => value !== 'Confirmed')
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
          </select>
        </label>
        <label className="tm-full">
          Traveller notes
          <textarea
            rows={3}
            maxLength={3000}
            value={fields.notes}
            onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          />
        </label>
      </div>
      <div className="tm-actions">
        <button className="tm-button" disabled={busy}>
          {busy ? 'Saving…' : 'Save arrangement'}
        </button>
        <button className="tm-button tm-secondary" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
