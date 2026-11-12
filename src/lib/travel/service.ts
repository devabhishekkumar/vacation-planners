import { randomUUID } from 'node:crypto';
import { bookingSnapshot } from '../booking-service';
import { travelDatabase } from './database';
import {
  serviceKinds,
  arrangementStatuses,
  serviceDefinitions,
  type ServiceKind,
  type TravelService,
  type TravelSnapshot,
  type ItineraryActivity,
  type Coordinator,
} from '../../features/travel/types';
export type TravelActor = { admin: boolean; customerId?: string };
import { TravelError } from './errors';
export { TravelError } from './errors';
export function travelBooking(id: string, actor: TravelActor) {
  const booking = bookingSnapshot().bookings.find((item) => item.id === id);
  if (!booking || (!actor.admin && (!actor.customerId || booking.customerId !== actor.customerId)))
    throw new TravelError('Booking not found.', 404);
  return booking;
}
function plan(id: string) {
  const d = travelDatabase();
  d.prepare('INSERT OR IGNORE INTO trip_plans(booking_id) VALUES(?)').run(id);
  return d.prepare('SELECT * FROM trip_plans WHERE booking_id=?').get(id) as {
    revision: number;
    coordinator: string;
    draft: string;
    published: string;
    published_at: string | null;
  };
}
const object = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TravelError('Invalid record.');
  return input as Record<string, unknown>;
};
function text(value: unknown, max = 250) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max)
    throw new TravelError(`Enter text no longer than ${max} characters.`);
  return value.trim();
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + 'T12:00:00Z')) &&
    new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value
  );
}
function validateFields(kind: ServiceKind, input: unknown, confirmed = false) {
  const source = object(input),
    fields: Record<string, string> = {};
  for (const field of [
    ...serviceDefinitions[kind].fields,
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ]) {
    const value = text(source[field.key], field.type === 'textarea' ? 3000 : 250);
    if (
      (('required' in field && field.required) ||
        (confirmed && 'confirm' in field && field.confirm)) &&
      !value
    )
      throw new TravelError(
        `${field.label} is required${confirmed ? ' to confirm this arrangement' : ''}.`,
      );
    if (value && field.type === 'date' && !validDate(value))
      throw new TravelError(`Choose a valid ${field.label.toLowerCase()}.`);
    if (value && field.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
      throw new TravelError('Enter a valid time.');
    if (value && field.type === 'tel' && !/^\+?[\d ()-]{7,28}$/.test(value))
      throw new TravelError('Enter a valid contact number.');
    if (value && 'options' in field && field.options && !field.options.includes(value))
      throw new TravelError('Choose a valid option.');
    fields[field.key] = value;
  }
  if (fields.checkout && fields.checkin && fields.checkout <= fields.checkin)
    throw new TravelError('Check-out must be after check-in.');
  if (
    fields.arrivalDate &&
    fields.date &&
    (fields.arrivalDate < fields.date ||
      (fields.arrivalDate === fields.date &&
        fields.arrival &&
        fields.departure &&
        fields.arrival < fields.departure))
  )
    throw new TravelError(
      'Arrival must be after departure (use local destination dates and times).',
    );
  return fields;
}
function itinerary(input: unknown): ItineraryActivity[] {
  if (!Array.isArray(input) || input.length > 300)
    throw new TravelError('Use at most 300 itinerary activities.');
  const ids = new Set<string>();
  return input.map((value) => {
    const row = object(value),
      id = text(row.id, 100),
      day = Number(row.day),
      time = text(row.time, 5),
      title = text(row.title, 200),
      status = text(row.status, 20);
    if (
      !id ||
      ids.has(id) ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > 365 ||
      !title ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
      !arrangementStatuses.includes(status as never)
    )
      throw new TravelError(
        'Each activity needs a unique ID, day (1–365), time, title and valid status.',
      );
    ids.add(id);
    return {
      id,
      day,
      time,
      title,
      location: text(row.location),
      notes: text(row.notes, 2000),
      status: status as ItineraryActivity['status'],
    };
  });
}
export function travelSnapshot(
  id: string,
  actor: TravelActor,
  publishedOnly = false,
): TravelSnapshot {
  const b = travelBooking(id, actor),
    p = plan(id),
    d = travelDatabase();
  const services = d
    .prepare('SELECT * FROM trip_services WHERE booking_id=? ORDER BY rowid')
    .all(id)
    .map((row) => ({
      id: row.id,
      bookingId: row.booking_id,
      kind: row.kind,
      status: row.status,
      fields: JSON.parse(row.fields as string),
      updatedAt: row.updated_at,
    })) as TravelService[];
  const documents = d
    .prepare(
      `SELECT x.id,x.service_id serviceId,x.name,x.mime,x.size FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE s.booking_id=? ${actor.admin ? '' : "AND s.status='Confirmed'"} ORDER BY x.rowid`,
    )
    .all(id) as unknown as TravelSnapshot['documents'];
  const notifications = d
    .prepare(
      'SELECT id,message,created_at createdAt,is_read FROM trip_notifications WHERE booking_id=? ORDER BY rowid DESC LIMIT 50',
    )
    .all(id)
    .map((row) => ({
      id: String(row.id),
      message: String(row.message),
      createdAt: String(row.createdAt),
      read: Boolean(row.is_read),
    }));
  return {
    booking: {
      id: b.id,
      customer: b.customer,
      customerId: b.customerId,
      tour: b.tour,
      travelDate: b.travelDate,
      returnDate: b.returnDate,
      travelers: b.travelers,
      status: b.status,
      phone: b.phone,
    },
    revision: p.revision,
    services,
    documents,
    itinerary: JSON.parse(actor.admin && !publishedOnly ? p.draft : p.published),
    publishedAt: p.published_at,
    coordinator: { name: '', phone: '', email: '', ...JSON.parse(p.coordinator) },
    notifications,
    admin: actor.admin,
  };
}
function notification(id: string, message: string) {
  travelDatabase()
    .prepare('INSERT INTO trip_notifications(id,booking_id,message,created_at) VALUES(?,?,?,?)')
    .run(randomUUID(), id, message, new Date().toISOString());
}
function service(id: string, bookingId: string) {
  const row = travelDatabase()
    .prepare('SELECT * FROM trip_services WHERE id=? AND booking_id=?')
    .get(id, bookingId);
  if (!row) throw new TravelError('Arrangement not found.', 404);
  return row;
}
export function mutateTravel(id: string, actor: TravelActor, input: unknown) {
  if (!actor.admin) throw new TravelError('Operator sign-in required.', 403);
  const b = travelBooking(id, actor);
  if (b.status === 'Cancelled') throw new TravelError('Cancelled bookings are read-only.');
  const body = object(input);
  const d = travelDatabase();
  plan(id);
  d.exec('BEGIN IMMEDIATE');
  try {
    if (
      !Number.isInteger(body.revision) ||
      d
        .prepare('UPDATE trip_plans SET revision=revision+1 WHERE booking_id=? AND revision=?')
        .run(id, Number(body.revision)).changes !== 1
    )
      throw new TravelError('This trip changed elsewhere. Refresh before saving.', 409);
    const op = body.operation;
    if (op === 'service-save') {
      const kind = text(body.kind, 30) as ServiceKind;
      if (!serviceKinds.includes(kind)) throw new TravelError('Invalid travel service.');
      const status = text(body.status, 20);
      if (!['Pending', 'Changed', 'Cancelled'].includes(status))
        throw new TravelError('Use Confirm to confirm a travel service.');
      const fields = validateFields(kind, body.fields),
        serviceId = text(body.id, 100) || randomUUID();
      if (body.id) {
        const previous = service(serviceId, id);
        if (previous.kind !== kind) throw new TravelError('The service type cannot be changed.');
      }
      d.prepare(
        'INSERT INTO trip_services VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,fields=excluded.fields,updated_at=excluded.updated_at',
      ).run(serviceId, id, kind, status, JSON.stringify(fields), new Date().toISOString());
      notification(
        id,
        `${serviceDefinitions[kind].label} arrangement ${body.id ? 'updated' : 'added'}: ${status}.`,
      );
    } else if (op === 'service-confirm') {
      const row = service(text(body.id, 100), id);
      if (row.status === 'Cancelled')
        throw new TravelError('Edit the cancelled arrangement before confirming it.');
      validateFields(row.kind as ServiceKind, JSON.parse(row.fields as string), true);
      d.prepare("UPDATE trip_services SET status='Confirmed',updated_at=? WHERE id=?").run(
        new Date().toISOString(),
        String(row.id),
      );
      notification(
        id,
        `${serviceDefinitions[row.kind as ServiceKind].label} arrangement confirmed.`,
      );
    } else if (op === 'service-delete') {
      const row = service(text(body.id, 100), id);
      d.prepare('DELETE FROM trip_services WHERE id=?').run(String(row.id));
      notification(
        id,
        `${serviceDefinitions[row.kind as ServiceKind].label} arrangement removed. Please review your updated travel details.`,
      );
    } else if (op === 'itinerary-save' || op === 'itinerary-publish') {
      const entries = itinerary(body.itinerary);
      if (op === 'itinerary-publish' && !entries.length)
        throw new TravelError('Add activities before publishing.');
      d.prepare('UPDATE trip_plans SET draft=? WHERE booking_id=?').run(
        JSON.stringify(entries),
        id,
      );
      if (op === 'itinerary-publish') {
        d.prepare('UPDATE trip_plans SET published=?,published_at=? WHERE booking_id=?').run(
          JSON.stringify(entries),
          new Date().toISOString(),
          id,
        );
        notification(id, 'Your day-wise itinerary has been published.');
      }
    } else if (op === 'coordinator') {
      const source = object(body.coordinator);
      const contact: Coordinator = {
        name: text(source.name, 120),
        phone: text(source.phone, 28),
        email: text(source.email, 254),
      };
      if (contact.phone && !/^\+?[\d ()-]{7,28}$/.test(contact.phone))
        throw new TravelError('Enter a valid coordinator phone.');
      if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email))
        throw new TravelError('Enter a valid coordinator email.');
      d.prepare('UPDATE trip_plans SET coordinator=? WHERE booking_id=?').run(
        JSON.stringify(contact),
        id,
      );
      notification(id, 'Your travel coordinator contact details have been updated.');
    } else if (op === 'document-delete') {
      const row = d
        .prepare(
          'SELECT x.id,x.service_id FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE x.id=? AND s.booking_id=?',
        )
        .get(text(body.id, 100), id);
      if (!row) throw new TravelError('Document not found.', 404);
      d.prepare('DELETE FROM trip_documents WHERE id=?').run(String(row.id));
      d.prepare(
        "UPDATE trip_services SET status=CASE WHEN status='Confirmed' THEN 'Changed' ELSE status END WHERE id=?",
      ).run(String(row.service_id));
      notification(id, 'A travel document was removed. Please check your updated arrangements.');
    } else throw new TravelError('Unknown travel operation.');
    d.exec('COMMIT');
    return travelSnapshot(id, actor);
  } catch (error) {
    d.exec('ROLLBACK');
    throw error;
  }
}
export function uploadTravelDocument(
  id: string,
  actor: TravelActor,
  serviceId: string,
  revision: number,
  name: string,
  mime: string,
  bytes: Uint8Array,
) {
  if (!actor.admin) throw new TravelError('Operator sign-in required.', 403);
  const booking = travelBooking(id, actor);
  if (booking.status === 'Cancelled') throw new TravelError('Cancelled bookings are read-only.');
  const d = travelDatabase();
  const row = service(serviceId, id);
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new TravelError('Upload a PDF, PNG or JPEG no larger than 8 MB.');
  const buffer = Buffer.from(bytes);
  const valid =
    (mime === 'application/pdf' && buffer.subarray(0, 5).toString() === '%PDF-') ||
    (mime === 'image/png' &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (mime === 'image/jpeg' && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255);
  if (!valid) throw new TravelError('File contents must match a PDF, PNG or JPEG.');
  const filename = text(name, 180).replace(/[^a-zA-Z0-9._ -]/g, '_') || 'travel-document';
  d.exec('BEGIN IMMEDIATE');
  try {
    if (
      !Number.isInteger(revision) ||
      d
        .prepare('UPDATE trip_plans SET revision=revision+1 WHERE booking_id=? AND revision=?')
        .run(id, revision).changes !== 1
    )
      throw new TravelError('This trip changed elsewhere. Refresh before uploading.', 409);
    const usage = d
      .prepare(
        'SELECT count(*) count,coalesce(sum(x.size),0) total FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE s.booking_id=?',
      )
      .get(id)!;
    if (Number(usage.count) >= 50 || Number(usage.total) + bytes.length > 64 * 1024 * 1024)
      throw new TravelError('Trip document limit reached (50 files / 64 MB).');
    d.prepare('INSERT INTO trip_documents VALUES(?,?,?,?,?,?)').run(
      randomUUID(),
      serviceId,
      filename,
      mime,
      bytes.length,
      buffer,
    );
    d.prepare(
      "UPDATE trip_services SET status=CASE WHEN status='Confirmed' THEN 'Changed' ELSE status END,updated_at=? WHERE id=?",
    ).run(new Date().toISOString(), String(row.id));
    notification(
      id,
      'A ticket or voucher was uploaded. It will be downloadable after the arrangement is confirmed.',
    );
    d.exec('COMMIT');
    return travelSnapshot(id, actor);
  } catch (error) {
    d.exec('ROLLBACK');
    throw error;
  }
}
export function downloadTravelDocument(documentId: string, actor: TravelActor) {
  const d = travelDatabase();
  const row = d
    .prepare(
      'SELECT x.*,s.booking_id,s.status FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE x.id=?',
    )
    .get(documentId);
  if (!row) throw new TravelError('Document not found.', 404);
  travelBooking(String(row.booking_id), actor);
  if (!actor.admin && row.status !== 'Confirmed')
    throw new TravelError('This document is not confirmed.', 404);
  return { name: String(row.name), mime: String(row.mime), bytes: row.content as Uint8Array };
}
export function readTravelNotices(id: string, actor: TravelActor) {
  travelBooking(id, actor);
  travelDatabase().prepare('UPDATE trip_notifications SET is_read=1 WHERE booking_id=?').run(id);
}
