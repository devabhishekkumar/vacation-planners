'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, recordActivity, type User } from './database';
import { workspaceUser } from './workspace';
const text = (f: FormData, key: string, max = 200) =>
  String(f.get(key) || '')
    .trim()
    .slice(0, max);
function refresh() {
  for (const path of ['/admin', '/team', '/customer']) revalidatePath(path);
}
function result(message: string): never {
  redirect('/admin?message=' + encodeURIComponent(message));
}
export async function createAccount(f: FormData) {
  const name = text(f, 'name', 90),
    email = text(f, 'email', 254).toLowerCase(),
    role = text(f, 'role');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !['team', 'customer'].includes(role))
    result('Enter a name, valid email and record type.');
  if (db().prepare('SELECT id FROM users WHERE email=?').get(email))
    result('A record with this email already exists.');
  try {
    db()
      .prepare('INSERT INTO users VALUES(?,?,?,?,?,1)')
      .run(crypto.randomUUID(), name, email, 'disabled', role);
  } catch {
    result('Could not create record. Check whether the email already exists.');
  }
  recordActivity(workspaceUser().id, 'Created ' + role + ' record: ' + email);
  refresh();
  result('Record created.');
}
export async function toggleAccount(f: FormData) {
  const id = text(f, 'id');
  const user = db().prepare('SELECT id,email,active,role FROM users WHERE id=?').get(id) as
    | User
    | undefined;
  if (!user || user.role === 'admin') return;
  db()
    .prepare('UPDATE users SET active=? WHERE id=?')
    .run(user.active ? 0 : 1, id);
  recordActivity(
    workspaceUser().id,
    (user.active ? 'Marked inactive: ' : 'Marked active: ') + user.email,
  );
  refresh();
}
export async function createEnquiry(f: FormData) {
  const customerId = text(f, 'customerId');
  const customer = db()
    .prepare("SELECT id FROM users WHERE id=? AND role='customer' AND active=1")
    .get(customerId);
  const destination = text(f, 'destination', 120),
    requirements = text(f, 'requirements', 3000);
  if (!customer || !destination || !requirements)
    result('Select a customer, destination and requirements.');
  const id = crypto.randomUUID();
  db()
    .prepare(
      'INSERT INTO enquiries(id,customer_id,destination,requirements,created_at) VALUES(?,?,?,?,?)',
    )
    .run(id, customerId, destination, requirements, new Date().toISOString());
  recordActivity(workspaceUser().id, 'Created enquiry ' + id + ' for ' + destination);
  refresh();
}
export async function updateEnquiry(f: FormData) {
  const id = text(f, 'id');
  const lead = db().prepare('SELECT assigned_to FROM enquiries WHERE id=?').get(id) as
    | { assigned_to: string | null }
    | undefined;
  if (!lead) result('Enquiry unavailable.');
  const status = text(f, 'status'),
    followup = text(f, 'followup', 10),
    notes = text(f, 'notes', 3000);
  if (
    !['New', 'Contacted', 'Follow-up', 'Quoted', 'Confirmed', 'Lost'].includes(status) ||
    (followup && !/^\d{4}-\d{2}-\d{2}$/.test(followup))
  )
    result('Invalid status or follow-up date.');
  const assigned = f.has('assigned') ? text(f, 'assigned') || null : lead.assigned_to;
  if (
    assigned &&
    !db().prepare("SELECT id FROM users WHERE id=? AND role='team' AND active=1").get(assigned)
  )
    result('Select an active employee.');
  db()
    .prepare('UPDATE enquiries SET assigned_to=?,status=?,followup=?,notes=? WHERE id=?')
    .run(assigned, status, followup, notes, id);
  recordActivity(
    workspaceUser().id,
    'Updated enquiry ' + id + ': ' + status + ', follow-up ' + (followup || 'none'),
  );
  refresh();
}
