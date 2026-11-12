import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, createHash } from 'node:crypto';
import { db } from './database';
import { customerNext, type CustomerAccount } from './customer-account';
const name = 'vp_customer_session';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export async function currentCustomer(): Promise<CustomerAccount | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  return (
    (db()
      .prepare(
        "SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1 AND u.role='customer'",
      )
      .get(digest(token), Date.now()) as CustomerAccount | undefined) || null
  );
}
export async function requireCustomer(next = '/customer') {
  const user = await currentCustomer();
  if (!user) redirect('/login/customer?next=' + encodeURIComponent(customerNext(next)));
  return user;
}
export async function endCustomerSession() {
  const jar = await cookies(),
    token = jar.get(name)?.value;
  if (token) db().prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
  jar.delete(name);
}
export async function startCustomerSession(user: CustomerAccount) {
  await endCustomerSession();
  const token = randomBytes(32).toString('hex');
  db().prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
  db()
    .prepare('INSERT INTO sessions VALUES(?,?,?)')
    .run(digest(token), user.id, Date.now() + 8 * 60 * 60 * 1000);
  (await cookies()).set(name, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
}
