import { db } from '../auth/database';
import { bookingSnapshot } from '../booking-service';
/** Idempotent feature migration, run lazily on first access. */
export function travelDatabase() {
  bookingSnapshot();
  const d = db();
  d.exec(`CREATE TABLE IF NOT EXISTS travel_feature_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS trip_plans(booking_id TEXT PRIMARY KEY REFERENCES travel_bookings(id),revision INTEGER NOT NULL DEFAULT 0,coordinator TEXT NOT NULL DEFAULT '{}',draft TEXT NOT NULL DEFAULT '[]',published TEXT NOT NULL DEFAULT '[]',published_at TEXT);
  CREATE TABLE IF NOT EXISTS trip_services(id TEXT PRIMARY KEY,booking_id TEXT NOT NULL REFERENCES trip_plans(booking_id),kind TEXT NOT NULL CHECK(kind IN ('transport','hotel','taxi','food','sightseeing')),status TEXT NOT NULL CHECK(status IN ('Pending','Confirmed','Changed','Cancelled')),fields TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS trip_service_booking ON trip_services(booking_id);
  CREATE TABLE IF NOT EXISTS trip_documents(id TEXT PRIMARY KEY,service_id TEXT NOT NULL REFERENCES trip_services(id) ON DELETE CASCADE,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,content BLOB NOT NULL);
  CREATE TABLE IF NOT EXISTS trip_notifications(id TEXT PRIMARY KEY,booking_id TEXT NOT NULL REFERENCES trip_plans(booking_id),message TEXT NOT NULL,created_at TEXT NOT NULL,is_read INTEGER NOT NULL DEFAULT 0);
  CREATE INDEX IF NOT EXISTS trip_notification_booking ON trip_notifications(booking_id);
  INSERT OR IGNORE INTO travel_feature_migrations VALUES(1,datetime('now'));`);
  return d;
}
