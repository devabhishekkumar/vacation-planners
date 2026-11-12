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
  return db();
}
export async function customerProfile(id: string): Promise<CustomerProfile> {
  const d = database();
  const user = (await d.get(
    "SELECT name,email FROM users WHERE id=$1 AND role='customer' AND active=1",
    id,
  )) as
    | {
        name: string;
        email: string;
      }
    | undefined;
  if (!user) throw Error('Customer account unavailable.');
  const profile = (await d.get(
    'SELECT phone,city,address,preferences,updated_at FROM customer_profiles WHERE user_id=$1',
    id,
  )) as
    | {
        phone: string;
        city: string;
        address: string;
        preferences: string;
        updated_at: string;
      }
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
export async function saveCustomerProfile(id: string, input: Record<string, unknown>) {
  await customerProfile(id);
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
  return await d.transaction(async () => {
    await d.run('UPDATE users SET name=$1 WHERE id=$2', name, id);
    await d.run(
      'INSERT INTO customer_profiles(user_id,phone,city,address,preferences,updated_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,city=excluded.city,address=excluded.address,preferences=excluded.preferences,updated_at=excluded.updated_at',
      id,
      phone,
      city,
      address,
      preferences,
      new Date().toISOString(),
    );
    return await customerProfile(id);
  });
}
