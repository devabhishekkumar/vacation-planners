import { db } from './database';
export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  preferences: string;
  updatedAt: string;
};
function database() {
  const d = db();
  d.exec(
    `CREATE TABLE IF NOT EXISTS customer_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id),phone TEXT NOT NULL DEFAULT '',city TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',preferences TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL)`,
  );
  return d;
}
export function customerProfile(id: string): CustomerProfile {
  const d = database();
  const user = d
    .prepare("SELECT name,email FROM users WHERE id=? AND role='customer' AND active=1")
    .get(id) as { name: string; email: string } | undefined;
  if (!user) throw Error('Customer account unavailable.');
  const profile = d
    .prepare(
      'SELECT phone,city,address,preferences,updated_at FROM customer_profiles WHERE user_id=?',
    )
    .get(id) as
    | { phone: string; city: string; address: string; preferences: string; updated_at: string }
    | undefined;
  return {
    ...user,
    phone: profile?.phone || '',
    city: profile?.city || '',
    address: profile?.address || '',
    preferences: profile?.preferences || '',
    updatedAt: profile?.updated_at || '',
  };
}
function field(value: unknown, label: string, max: number) {
  if (value !== undefined && typeof value !== 'string') throw Error('Enter a valid ' + label + '.');
  const result = String(value || '').trim();
  if (result.length > max) throw Error(label + ' must be no more than ' + max + ' characters.');
  return result;
}
export function saveCustomerProfile(id: string, input: Record<string, unknown>) {
  customerProfile(id);
  const name = field(input.name, 'name', 90),
    phone = field(input.phone, 'phone number', 28),
    city = field(input.city, 'city', 90),
    address = field(input.address, 'address', 400),
    preferences = field(input.preferences, 'travel preferences', 1000);
  if (name.length < 2) throw Error('Enter your full name (at least 2 characters).');
  if (
    phone &&
    (!/^\+?[\d ()-]+$/.test(phone) ||
      phone.replace(/\D/g, '').length < 7 ||
      phone.replace(/\D/g, '').length > 15)
  )
    throw Error('Enter a valid phone number, including country code where possible.');
  const d = database();
  d.exec('BEGIN IMMEDIATE');
  try {
    d.prepare('UPDATE users SET name=? WHERE id=?').run(name, id);
    d.prepare(
      'INSERT INTO customer_profiles VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,city=excluded.city,address=excluded.address,preferences=excluded.preferences,updated_at=excluded.updated_at',
    ).run(id, phone, city, address, preferences, new Date().toISOString());
    d.exec('COMMIT');
    return customerProfile(id);
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}
