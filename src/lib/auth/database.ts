import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
let connection: DatabaseSync | undefined;
export function db() {
  if (connection) return connection;
  const directory = process.env.AUTH_DATA_DIR || join(process.cwd(), '.data');
  mkdirSync(directory, { recursive: true });
  connection = new DatabaseSync(join(directory, 'accounts.sqlite'));
  connection.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','team','customer')),active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts(email TEXT PRIMARY KEY,count INTEGER NOT NULL,until_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS enquiries(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL REFERENCES users(id),assigned_to TEXT REFERENCES users(id),destination TEXT NOT NULL,requirements TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'New',followup TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS activity(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL REFERENCES users(id),message TEXT NOT NULL,created_at TEXT NOT NULL);
 `);
  return connection;
}
export type Role = 'admin' | 'team' | 'customer';
export type User = { id: string; name: string; email: string; role: Role; active: number };
export type Enquiry = {
  id: string;
  customer_id: string;
  assigned_to: string | null;
  destination: string;
  requirements: string;
  status: string;
  followup: string;
  notes: string;
  created_at: string;
  customer_name: string;
  employee_name: string | null;
};
export function recordActivity(actorId: string, message: string) {
  db()
    .prepare('INSERT INTO activity VALUES(?,?,?,?)')
    .run(crypto.randomUUID(), actorId, message, new Date().toISOString());
}
