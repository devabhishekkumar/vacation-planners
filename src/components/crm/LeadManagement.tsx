'use client';
import { useState, type FormEvent } from 'react';
import LeadWhatsApp from './LeadWhatsApp';
import { useDemo } from '@/features/crm/demo-store';
import { todayISO, type Lead } from '@/features/crm/demo-data';
export function LeadManagement({ lead }: { lead: Lead }) {
  const { editLead, data } = useDemo();
  const current = data.leads.find((l) => l.id === lead.id) || lead;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError('');
    try {
      await editLead(lead.id, {
        owner: String(f.get('owner')).trim(),
        nextFollowUp: String(f.get('date') || ''),
        notes: String(f.get('notes') || '').trim(),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save enquiry.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} onChange={() => setSaved(false)} className="crm-form-grid">
        <label className="crm-form-field">
          <span>Assigned employee</span>
          <input
            name="owner"
            required
            maxLength={60}
            defaultValue={current.owner}
            list="crm-employees"
          />
          <datalist id="crm-employees">
            {Array.from(new Set(data.leads.map((l) => l.owner))).map((owner) => (
              <option key={owner}>{owner}</option>
            ))}
          </datalist>
        </label>
        <label className="crm-form-field">
          <span>Next follow-up</span>
          <input name="date" type="date" defaultValue={current.nextFollowUp} />
        </label>
        <label className="crm-form-field crm-form-full">
          <span>Requirements and communication notes</span>
          <textarea name="notes" rows={4} maxLength={3000} defaultValue={current.notes} />
        </label>
        <button className="crm-btn crm-btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save lead changes'}
        </button>
        {error && (
          <p role="alert" className="crm-form-error">
            {error}
          </p>
        )}
        {saved && <p role="status">Saved to Admin.</p>}
      </form>
      <LeadWhatsApp lead={current} />
      <h3>Activity history</h3>
      {data.activities.filter((a) => a.leadId === lead.id).length ? (
        data.activities
          .filter((a) => a.leadId === lead.id)
          .map((a) => (
            <p key={a.id} className="crm-drawer-notes">
              {a.message}
              <small className="crm-subcell">{new Date(a.at).toLocaleString('en-IN')}</small>
            </p>
          ))
      ) : (
        <p>No changes recorded yet.</p>
      )}
    </>
  );
}
export function AdminOverview() {
  const { data } = useDemo();
  const owners = Array.from(new Set(data.leads.map((l) => l.owner)));
  const today = todayISO();
  return (
    <>
      <div className="crm-panel">
        <div className="crm-panel-header">
          <div>
            <h2>Team workload</h2>
            <p>
              Demo overview shared with the enquiries and follow-up views. Open an enquiry to change
              its assignment.
            </p>
          </div>
        </div>
        <div className="crm-table-scroll">
          <table className="crm-table">
            <thead>
              <tr>
                {['EMPLOYEE', 'ASSIGNED LEADS', 'ACTIVE LEADS', 'DUE TODAY', 'OVERDUE TASKS'].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner}>
                  <td>{owner}</td>
                  <td>{data.leads.filter((l) => l.owner === owner).length}</td>
                  <td>
                    {
                      data.leads.filter(
                        (l) => l.owner === owner && !['Confirmed', 'Lost'].includes(l.status),
                      ).length
                    }
                  </td>
                  <td>
                    {
                      data.tasks.filter(
                        (t) => t.owner === owner && !t.completed && t.dueDate === today,
                      ).length
                    }
                  </td>
                  <td>
                    {
                      data.tasks.filter(
                        (t) => t.owner === owner && !t.completed && t.dueDate < today,
                      ).length
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="crm-panel">
        <div className="crm-panel-header">
          <div>
            <h2>Workspace activity</h2>
            <p>
              Assignment, lead status, notes and follow-up changes. Employee attribution requires
              authenticated accounts.
            </p>
          </div>
        </div>
        <div className="crm-table-scroll">
          <table className="crm-table">
            <thead>
              <tr>
                <th>DATE & TIME</th>
                <th>ENQUIRY</th>
                <th>ACTIVITY</th>
              </tr>
            </thead>
            <tbody>
              {data.activities.length ? (
                data.activities.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.at).toLocaleString('en-IN')}</td>
                    <td>{a.leadId || 'General task'}</td>
                    <td>{a.message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No activity yet. Update a lead or follow-up to see it here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="crm-chart-note">
        This page is an unprotected frontend demonstration. Secure administrator access and employee
        account management require server authentication.
      </p>
    </>
  );
}
