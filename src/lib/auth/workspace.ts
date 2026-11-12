import { db, type User } from './database';
/** Local operator label for changes made without authentication. */
export function workspaceUser(): User {
  const id = 'local-workspace';
  db()
    .prepare('INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,1)')
    .run(id, 'Local workspace', 'local-workspace@internal.invalid', 'disabled', 'admin');
  return db().prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(id) as User;
}
