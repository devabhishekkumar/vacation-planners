import { db, type User } from './database';
/** Local operator label for changes made without authentication. */
export async function workspaceUser(): Promise<User> {
  const id = 'local-workspace';
  await db().run(
    'INSERT INTO users(id,name,email,password,role,active) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT DO NOTHING',
    id,
    'Local workspace',
    'local-workspace@internal.invalid',
    'disabled',
    'admin',
  );
  return (await db().get('SELECT id,name,email,role,active FROM users WHERE id=$1', id)) as User;
}
