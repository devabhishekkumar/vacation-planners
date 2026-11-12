import { randomUUID } from 'node:crypto';
import { db } from './auth/database';
import { leadStatuses, todayISO, type Lead } from '../features/crm/demo-data';
const text = (v: unknown, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);
function database() {
  return db();
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
export async function allLeads() {
  return (
    await database().all('SELECT payload FROM admin_leads ORDER BY insertion_order DESC')
  ).map((r) => JSON.parse(r.payload as string) as Lead);
}
export async function createLead(input: Partial<Lead>, submissionKey?: string) {
  return database().transaction(async () => {
    const d = database();
    if (submissionKey) {
      if (!/^[a-zA-Z0-9-]{16,100}$/.test(submissionKey))
        throw Error('Invalid submission reference.');
      const existing = await d.get(
        'SELECT id FROM admin_leads WHERE submission_key=$1',
        submissionKey,
      );
      if (existing) return String(existing.id);
    }
    const lead = validate(input);
    await d.run(
      'INSERT INTO admin_leads(id,payload,submission_key) VALUES($1,$2,$3)',
      lead.id,
      JSON.stringify(lead),
      submissionKey || null,
    );
    return lead.id;
  });
}
export async function patchLead(
  id: string,
  changes: Partial<Pick<Lead, 'status' | 'owner' | 'nextFollowUp' | 'notes'>>,
) {
  return database().transaction(async () => {
    const d = database();
    const row = await d.get('SELECT payload FROM admin_leads WHERE id=$1', id);
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
    await d.run('UPDATE admin_leads SET payload=$1 WHERE id=$2', JSON.stringify(next), id);
    return await allLeads();
  });
}
export async function importLocalLeads(leads: Lead[]) {
  const d = database();
  if (!Array.isArray(leads) || leads.length > 2000) throw Error('Invalid enquiry import.');
  return await d.transaction(async () => {
    for (const item of leads) {
      if (await d.get('SELECT id FROM admin_leads WHERE id=$1', item.id)) continue;
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
      await d.run(
        'INSERT INTO admin_leads(id,payload,submission_key) VALUES($1,$2,NULL)',
        lead.id,
        JSON.stringify(lead),
      );
    }
    return await allLeads();
  });
}
