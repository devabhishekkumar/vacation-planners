'use client';
import { useState } from 'react';
import { arrangementStatuses, type ItineraryActivity } from '@/features/travel/types';
export function ItineraryTimeline({ activities }: { activities: ItineraryActivity[] }) {
  if (!activities.length)
    return (
      <div className="tm-empty">
        <h3>Your itinerary is being prepared</h3>
        <p>The published day-wise plan will appear here when it is ready.</p>
      </div>
    );
  const days = [...new Set(activities.map((a) => a.day))].sort((a, b) => a - b);
  return (
    <div className="tm-timeline">
      {days.map((day) => (
        <section key={day}>
          <h3>Day {day}</h3>
          <ol>
            {activities
              .filter((a) => a.day === day)
              .map((a) => (
                <li key={a.id}>
                  <time>{a.time}</time>
                  <div>
                    <span className={`tm-status tm-${a.status.toLowerCase()}`}>{a.status}</span>
                    <h4>{a.title}</h4>
                    {a.location && <p>{a.location}</p>}
                    {a.notes && <p>{a.notes}</p>}
                  </div>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
export default function ItineraryBuilder({
  initial,
  busy,
  onSave,
}: {
  initial: ItineraryActivity[];
  busy: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [activities, setActivities] = useState(initial);
  const change = (id: string, values: Partial<ItineraryActivity>) =>
    setActivities((previous) => previous.map((a) => (a.id === id ? { ...a, ...values } : a)));
  const move = (index: number, offset: number) => {
    const next = [...activities];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setActivities(next);
  };
  return (
    <form
      className="tm-card"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({ operation: 'itinerary-save', itinerary: activities });
      }}
    >
      <h2>Day-wise itinerary builder</h2>
      <p className="tm-muted">
        Drafts stay private. Publish to update the customer’s timeline. Activities are grouped by
        day and keep the order you choose within each day.
      </p>
      {!activities.length && (
        <p className="tm-empty">Start with an arrival, transfer, meal or activity.</p>
      )}
      {activities.map((a, index) => (
        <fieldset className="tm-itinerary-editor" key={a.id}>
          <legend>Activity {index + 1}</legend>
          <div className="tm-form-grid">
            <label>
              Day
              <input
                type="number"
                min="1"
                max="365"
                required
                value={a.day}
                onChange={(e) => change(a.id, { day: Number(e.target.value) })}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                required
                value={a.time}
                onChange={(e) => change(a.id, { time: e.target.value })}
              />
            </label>
            <label>
              Activity title
              <input
                required
                maxLength={200}
                value={a.title}
                onChange={(e) => change(a.id, { title: e.target.value })}
              />
            </label>
            <label>
              Location
              <input
                maxLength={250}
                value={a.location}
                onChange={(e) => change(a.id, { location: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={a.status}
                onChange={(e) =>
                  change(a.id, { status: e.target.value as ItineraryActivity['status'] })
                }
              >
                {arrangementStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <textarea
                maxLength={2000}
                value={a.notes}
                onChange={(e) => change(a.id, { notes: e.target.value })}
              />
            </label>
          </div>
          <div className="tm-actions">
            <button
              type="button"
              className="tm-button tm-secondary"
              disabled={index === 0 || busy}
              onClick={() => move(index, -1)}
              aria-label={`Move activity ${index + 1} up`}
            >
              ↑ Move up
            </button>
            <button
              type="button"
              className="tm-button tm-secondary"
              disabled={index === activities.length - 1 || busy}
              onClick={() => move(index, 1)}
              aria-label={`Move activity ${index + 1} down`}
            >
              ↓ Move down
            </button>
            <button
              type="button"
              className="tm-button tm-danger"
              disabled={busy}
              onClick={() => setActivities(activities.filter((value) => value.id !== a.id))}
            >
              Remove
            </button>
          </div>
        </fieldset>
      ))}
      <div className="tm-actions">
        <button
          type="button"
          className="tm-button tm-secondary"
          disabled={busy || activities.length >= 300}
          onClick={() =>
            setActivities([
              ...activities,
              {
                id: crypto.randomUUID(),
                day: activities.at(-1)?.day || 1,
                time: '09:00',
                title: '',
                location: '',
                notes: '',
                status: 'Pending',
              },
            ])
          }
        >
          + Add activity
        </button>
        <button type="submit" className="tm-button tm-secondary" disabled={busy}>
          Save draft
        </button>
        <button
          type="submit"
          className="tm-button"
          disabled={busy || !activities.length}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form?.reportValidity()) {
              event.preventDefault();
              void onSave({ operation: 'itinerary-publish', itinerary: activities });
            }
          }}
        >
          Publish itinerary
        </button>
      </div>
      <details>
        <summary>Preview timeline</summary>
        <ItineraryTimeline activities={activities} />
      </details>
    </form>
  );
}
