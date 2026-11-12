import { randomUUID } from 'node:crypto';
import { db } from './auth/database';
import { leadStatuses, todayISO, type Lead } from '../features/crm/demo-data';
const text = (v: unknown, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
function database() {
  const d = db();
  d.exec(
    'CREATE TABLE IF NOT EXISTS admin_leads(id TEXT PRIMARY KEY,payload TEXT NOT NULL,submission_key TEXT UNIQUE)',
  );
  return d;
}
function validDate(value: string) {
  return (
    !value ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value + 'T12:00:00Z')) &&
      new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value)
  );
}
function validate(input: Partial<Lead>): Lead {
  if (!input || typeof input !== 'object') throw Error('Invalid enquiry.');
  const name = text(input.name, 100),
    email = text(input.email, 180).toLowerCase(),
    phone = text(input.phone, 28),
    travelDate = text(input.travelDate, 10),
    travelers = Number(input.travelers);
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g, '').length < 7)
    throw Error('Enter your name, valid email and phone number.');
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 50)
    throw Error('Choose between 1 and 50 travellers.');
  if (!validDate(travelDate)) throw Error('Choose a valid travel date, or leave it blank.');
  return {
    id: 'LD-' + randomUUID().slice(0, 12).toUpperCase(),
    name,
    email,
    phone,
    travelDate,
    travelers,
    destination: text(input.destination, 120) || 'Not decided',
    notes: text(input.notes, 3000),
    source: text(input.source, 60) || 'Manual',
    priority: ['High', 'Medium', 'Low'].includes(String(input.priority))
      ? input.priority!
      : 'Medium',
    status: 'New',
    owner: 'Unassigned',
    createdAt: todayISO(),
    nextFollowUp: '',
  };
}
export function allLeads() {
  return database()
    .prepare('SELECT payload FROM admin_leads ORDER BY rowid DESC')
    .all()
    .map((r) => JSON.parse(r.payload as string) as Lead);
}
export function createLead(input: Partial<Lead>, submissionKey?: string) {
  const d = database();
  if (submissionKey) {
    if (!/^[a-zA-Z0-9-]{16,100}$/.test(submissionKey)) throw Error('Invalid submission reference.');
    const existing = d
      .prepare('SELECT id FROM admin_leads WHERE submission_key=?')
      .get(submissionKey);
    if (existing) return String(existing.id);
  }
  const lead = validate(input);
  d.prepare('INSERT INTO admin_leads VALUES(?,?,?)').run(
    lead.id,
    JSON.stringify(lead),
    submissionKey || null,
  );
  return lead.id;
}
export function patchLead(
  id: string,
  changes: Partial<Pick<Lead, 'status' | 'owner' | 'nextFollowUp' | 'notes'>>,
) {
  const d = database();
  const row = d.prepare('SELECT payload FROM admin_leads WHERE id=?').get(id);
  if (!row) throw Error('Enquiry not found.');
  const lead = JSON.parse(row.payload as string) as Lead;
  const next = { ...lead };
  if (changes.status !== undefined) {
    if (!leadStatuses.includes(changes.status)) throw Error('Invalid lead status.');
    next.status = changes.status;
  }
  if (changes.owner !== undefined) next.owner = text(changes.owner, 60) || 'Unassigned';
  if (changes.notes !== undefined) next.notes = text(changes.notes, 3000);
  if (changes.nextFollowUp !== undefined) {
    if (!validDate(changes.nextFollowUp)) throw Error('Invalid follow-up date.');
    next.nextFollowUp = changes.nextFollowUp;
  }
  d.prepare('UPDATE admin_leads SET payload=? WHERE id=?').run(JSON.stringify(next), id);
  return allLeads();
}
export function importLocalLeads(leads: Lead[]) {
  const d = database();
  if (!Array.isArray(leads) || leads.length > 2000) throw Error('Invalid enquiry import.');
  d.exec('BEGIN IMMEDIATE');
  try {
    for (const item of leads) {
      if (d.prepare('SELECT id FROM admin_leads WHERE id=?').get(item.id)) continue;
      const valid = validate(item);
      const lead = {
        ...valid,
        id: text(item.id, 100),
        status: leadStatuses.includes(item.status) ? item.status : 'New',
        owner: text(item.owner, 60) || 'Unassigned',
        nextFollowUp: validDate(item.nextFollowUp || '') ? item.nextFollowUp || '' : '',
        createdAt: text(item.createdAt, 10) || valid.createdAt,
      };
      if (!lead.id) throw Error('Invalid enquiry reference.');
      d.prepare('INSERT INTO admin_leads VALUES(?,?,NULL)').run(lead.id, JSON.stringify(lead));
    }
    d.exec('COMMIT');
    return allLeads();
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}
