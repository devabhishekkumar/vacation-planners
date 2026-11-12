import { randomBytes, randomUUID, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db, type User } from './database';
const scrypt = promisify(derive);
export type CustomerAccount = Pick<User, 'id' | 'name' | 'email'>;
export function customerNext(value: unknown) {
  const path = String(value || '');
  return path === '/customer/profile' ||
    path === '/customer/travel' ||
    /^\/customer\/travel\/[a-zA-Z0-9_-]+$/.test(path) ||
    path === '/reviews/write' ||
    /^\/book\/[a-z0-9-]+$/.test(path)
    ? path
    : '/customer';
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return salt + ':' + hash.toString('hex');
}
async function matches(password: string, stored: string) {
  const parts = stored.split(':');
  const valid = /^[a-f0-9]{32}$/.test(parts[0] || '') && /^[a-f0-9]{128}$/.test(parts[1] || '');
  const derived = (await scrypt(password, valid ? parts[0] : '0'.repeat(32), 64)) as Buffer;
  const expected = Buffer.from(valid ? parts[1] : '0'.repeat(128), 'hex');
  return timingSafeEqual(derived, expected) && valid;
}
function emailAddress(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .slice(0, 254);
}
async function limit(key: string) {
  return db().transaction(async () => {
    const now = Date.now();
    const row = (await db().get('SELECT count,until_at FROM attempts WHERE email=$1', key)) as
      | {
          count: number;
          until_at: number;
        }
      | undefined;
    if (row && row.count >= 5 && row.until_at > now)
      throw Error('Too many attempts. Please try again in 15 minutes.');
    await db().run(
      'INSERT INTO attempts(email,count,until_at) VALUES($1,1,$2) ON CONFLICT(email) DO UPDATE SET count=CASE WHEN attempts.until_at<=$3 THEN 1 ELSE attempts.count+1 END,until_at=CASE WHEN attempts.until_at<=$4 THEN excluded.until_at ELSE attempts.until_at END',
      key,
      now + 900000,
      now,
      now,
    );
  });
}
export async function loginCustomer(input: {
  email: unknown;
  password: unknown;
}): Promise<CustomerAccount> {
  const email = emailAddress(input.email),
    password = String(input.password || '');
  if (!email || password.length > 128) throw Error('Invalid email or password.');
  const key = 'customer-login:' + email;
  await limit(key);
  const user = (await db().get("SELECT * FROM users WHERE email=$1 AND role='customer'", email)) as
    | (User & {
        password: string;
      })
    | undefined;
  const valid = await matches(password, user?.password || 'disabled');
  if (!user || !valid || !user.active) throw Error('Invalid email or password.');
  await db().run('DELETE FROM attempts WHERE email=$1', key);
  return { id: user.id, name: user.name, email: user.email };
}
export async function signupCustomer(input: {
  name: unknown;
  email: unknown;
  password: unknown;
  confirm: unknown;
}): Promise<CustomerAccount> {
  const name = String(input.name || '')
      .trim()
      .slice(0, 90),
    email = emailAddress(input.email),
    password = String(input.password || '');
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email))
    throw Error('Enter your full name and a valid email address.');
  if (password.length < 12 || password.length > 128)
    throw Error('Choose a password of 12 to 128 characters.');
  if (password !== String(input.confirm || '')) throw Error('Passwords do not match.');
  await limit('customer-signup:' + email);
  if (await db().get('SELECT id FROM users WHERE email=$1', email))
    throw Error('An account with this email already exists. Sign in or contact our team for help.');
  const user = { id: randomUUID(), name, email };
  const hash = await passwordHash(password);
  try {
    await db().run(
      'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1)',
      user.id,
      name,
      email,
      hash,
      'customer',
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
      throw Error(
        'An account with this email already exists. Sign in or contact our team for help.',
      );
    // Transport failures are not duplicate accounts and must remain visible.
    throw error;
  }
  return user;
}
