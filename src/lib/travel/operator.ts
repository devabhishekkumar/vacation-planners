import { cookies } from 'next/headers';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from '../auth/database';
const cookieName = 'vp_travel_operator';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export async function travelOperator() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  return db()
    .prepare(
      "SELECT u.id,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.role='admin' AND u.active=1",
    )
    .get(hash(token), Date.now()) as { id: string; name: string } | undefined;
}
export async function loginTravelOperator(key: unknown) {
  const secret = process.env.TRAVEL_ADMIN_KEY;
  if (!secret || secret.length < 24)
    throw Error('Set TRAVEL_ADMIN_KEY to a secret of at least 24 characters on the server.');
  const d = db();
  const limiter = 'travel-operator-login';
  const now = Date.now();
  const attempts = d.prepare('SELECT count,until_at FROM attempts WHERE email=?').get(limiter) as
    | { count: number; until_at: number }
    | undefined;
  if (attempts && attempts.count >= 10 && attempts.until_at > now)
    throw Error('Too many attempts. Try again in 15 minutes.');
  d.prepare(
    'INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(email) DO UPDATE SET count=CASE WHEN until_at<=? THEN 1 ELSE count+1 END,until_at=CASE WHEN until_at<=? THEN excluded.until_at ELSE until_at END',
  ).run(limiter, now + 900000, now, now);
  const input = typeof key === 'string' && key.length <= 1000 ? key : '';
  if (!timingSafeEqual(Buffer.from(hash(input)), Buffer.from(hash(secret))))
    throw Error('Invalid travel operator access key.');
  d.prepare('DELETE FROM attempts WHERE email=?').run(limiter);
  d.prepare('INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,1)').run(
    'travel-operator',
    'Travel operator',
    'travel-operator@internal.invalid',
    'disabled',
    'admin',
  );
  await logoutTravelOperator();
  const token = randomBytes(32).toString('hex');
  d.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
    hash(token),
    'travel-operator',
    now + 8 * 3600000,
  );
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 3600,
  });
}
export async function logoutTravelOperator() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) db().prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
  jar.delete(cookieName);
}
