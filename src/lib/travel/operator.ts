import { cookies } from 'next/headers';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from '../auth/database';
const cookieName = 'vp_travel_operator';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export async function travelOperator() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  return (await db().get(
    "SELECT u.id,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires>$2 AND u.role='admin' AND u.active=1",
    hash(token),
    Date.now(),
  )) as
    | {
        id: string;
        name: string;
      }
    | undefined;
}
export async function loginTravelOperator(key: unknown) {
  const secret = process.env.TRAVEL_ADMIN_KEY;
  if (!secret || secret.length < 24)
    throw Error('Set TRAVEL_ADMIN_KEY to a secret of at least 24 characters on the server.');
  const d = db();
  const limiter = 'travel-operator-login';
  const now = Date.now();
  await d.transaction(async () => {
    const attempts = (await d.get(
      'SELECT count,until_at FROM attempts WHERE email=$1',
      limiter,
    )) as
      | {
          count: number;
          until_at: number;
        }
      | undefined;
    if (attempts && attempts.count >= 10 && attempts.until_at > now)
      throw Error('Too many attempts. Try again in 15 minutes.');
    await d.run(
      'INSERT INTO attempts(email,count,until_at) VALUES($1,1,$2) ON CONFLICT(email) DO UPDATE SET count=CASE WHEN attempts.until_at<=$3 THEN 1 ELSE attempts.count+1 END,until_at=CASE WHEN attempts.until_at<=$4 THEN excluded.until_at ELSE attempts.until_at END',
      limiter,
      now + 900000,
      now,
      now,
    );
  });
  const input = typeof key === 'string' && key.length <= 1000 ? key : '';
  if (!timingSafeEqual(Buffer.from(hash(input)), Buffer.from(hash(secret))))
    throw Error('Invalid travel operator access key.');
  await d.run('DELETE FROM attempts WHERE email=$1', limiter);
  await d.run(
    'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT DO NOTHING',
    'travel-operator',
    'Travel operator',
    'travel-operator@internal.invalid',
    'disabled',
    'admin',
  );
  await logoutTravelOperator();
  const token = randomBytes(32).toString('hex');
  await d.run(
    'INSERT INTO sessions(token,user_id,expires) VALUES($1,$2,$3)',
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
  if (token) await db().run('DELETE FROM sessions WHERE token=$1', hash(token));
  jar.delete(cookieName);
}
