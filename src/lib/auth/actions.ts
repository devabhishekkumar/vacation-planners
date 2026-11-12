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
  if (await db().get('SELECT id FROM users WHERE email=$1', email))
    result('A record with this email already exists.');
  try {
    await db().run(
      'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1)',
      crypto.randomUUID(),
      name,
      email,
      'disabled',
      role,
    );
  } catch {
    result('Could not create record. Check whether the email already exists.');
  }
  await recordActivity((await workspaceUser()).id, 'Created ' + role + ' record: ' + email);
  refresh();
  result('Record created.');
}
export async function toggleAccount(f: FormData) {
  const id = text(f, 'id');
  const user = (await db().get('SELECT id,email,active,role FROM users WHERE id=$1', id)) as
    | User
    | undefined;
  if (!user || user.role === 'admin') return;
  await db().run('UPDATE users SET active=$1 WHERE id=$2', user.active ? 0 : 1, id);
  await recordActivity(
    (await workspaceUser()).id,
    (user.active ? 'Marked inactive: ' : 'Marked active: ') + user.email,
  );
  refresh();
}
export async function createEnquiry(f: FormData) {
  const customerId = text(f, 'customerId');
  const customer = await db().get(
    "SELECT id FROM users WHERE id=$1 AND role='customer' AND active=1",
    customerId,
  );
  const destination = text(f, 'destination', 120),
    requirements = text(f, 'requirements', 3000);
  if (!customer || !destination || !requirements)
    result('Select a customer, destination and requirements.');
  const id = crypto.randomUUID();
  await db().run(
    'INSERT INTO enquiries(id,customer_id,destination,requirements,created_at) VALUES($1,$2,$3,$4,$5)',
    id,
    customerId,
    destination,
    requirements,
    new Date().toISOString(),
  );
  await recordActivity((await workspaceUser()).id, 'Created enquiry ' + id + ' for ' + destination);
  refresh();
}
export async function updateEnquiry(f: FormData) {
  const id = text(f, 'id');
  const lead = (await db().get('SELECT assigned_to FROM enquiries WHERE id=$1', id)) as
    | {
        assigned_to: string | null;
      }
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
    !(await db().get("SELECT id FROM users WHERE id=$1 AND role='team' AND active=1", assigned))
  )
    result('Select an active employee.');
  await db().run(
    'UPDATE enquiries SET assigned_to=$1,status=$2,followup=$3,notes=$4 WHERE id=$5',
    assigned,
    status,
    followup,
    notes,
    id,
  );
  await recordActivity(
    (await workspaceUser()).id,
    'Updated enquiry ' + id + ': ' + status + ', follow-up ' + (followup || 'none'),
  );
  refresh();
}
