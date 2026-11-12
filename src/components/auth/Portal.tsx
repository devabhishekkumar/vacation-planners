import Link from 'next/link';
import type { ReactNode } from 'react';
import type { User, Enquiry } from '@/lib/auth/database';
import { updateEnquiry, createEnquiry } from '@/lib/auth/actions';
export function Portal({ children }: { children: ReactNode }) {
  return (
    <main className="portal-page" id="main-content">
      <header className="portal-header">
        <Link href="/">Vacation Planners</Link>
        <nav aria-label="Workspaces" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/admin">Admin</Link>
          <Link href="/team">Team</Link>
          <Link href="/customer">Customers</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
export function EnquiryForm({ customers }: { customers?: User[] }) {
  return (
    <section className="portal-card">
      <h2>New travel enquiry</h2>
      <form action={createEnquiry} className="portal-form">
        {customers && (
          <label>
            Customer
            <select name="customerId" required>
              <option value="">Select customer</option>
              {customers
                .filter((c) => c.active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ? {c.email}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Destination
          <input name="destination" required maxLength={120} />
        </label>
        <label>
          Travel requirements
          <textarea name="requirements" required maxLength={3000} rows={3} />
        </label>
        <button>Create enquiry</button>
      </form>
    </section>
  );
}
export function LeadList({
  leads,
  staff,
  customer = false,
}: {
  leads: Enquiry[];
  staff?: User[];
  customer?: boolean;
}) {
  const today = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return (
    <section>
      <h2>{customer ? 'Your enquiries' : 'Lead pipeline & follow-ups'}</h2>
      {!leads.length && (
        <div className="portal-card">
          <p>
            {customer
              ? 'No enquiries yet. Tell us where you would like to travel.'
              : 'No assigned enquiries yet.'}
          </p>
        </div>
      )}
      <div className="portal-grid">
        {leads.map((l) => (
          <article className="portal-card" key={l.id}>
            <div className="portal-lead-heading">
              <h3>{l.destination}</h3>
              <span className="portal-tag">{l.status}</span>
            </div>
            <p>
              {l.customer_name} ? {new Date(l.created_at).toLocaleDateString('en-IN')}
            </p>
            <p>{l.requirements}</p>
            <small>Reference: {l.id}</small>
            <p>Assigned to: {l.employee_name || 'Awaiting assignment'}</p>
            {l.followup && (
              <p
                className={
                  !['Confirmed', 'Lost'].includes(l.status) && l.followup <= today
                    ? 'portal-due'
                    : ''
                }
              >
                Next follow-up: {l.followup}
                {!['Confirmed', 'Lost'].includes(l.status) &&
                  (l.followup < today ? ' ? Overdue' : l.followup === today ? ' ? Due today' : '')}
              </p>
            )}
            {!customer && (
              <form action={updateEnquiry} className="portal-form">
                <input name="id" type="hidden" value={l.id} />
                {staff && (
                  <label>
                    Assign employee
                    <select name="assigned" defaultValue={l.assigned_to || ''}>
                      <option value="">Unassigned</option>
                      {staff
                        .filter((s) => s.active || s.id === l.assigned_to)
                        .map((s) => (
                          <option disabled={!s.active} key={s.id} value={s.id}>
                            {s.name}
                            {!s.active ? ' (inactive)' : ''}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <label>
                  Lead status
                  <select name="status" defaultValue={l.status}>
                    {['New', 'Contacted', 'Follow-up', 'Quoted', 'Confirmed', 'Lost'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Follow-up date
                  <input type="date" name="followup" defaultValue={l.followup} />
                </label>
                <label>
                  Internal notes
                  <textarea name="notes" defaultValue={l.notes} rows={3} maxLength={3000} />
                </label>
                <button>Save lead</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
