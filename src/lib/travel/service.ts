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
export type TravelActor = {
  admin: boolean;
  customerId?: string;
};
import { TravelError } from './errors';
export { TravelError } from './errors';
export async function travelBooking(id: string, actor: TravelActor) {
  const booking = (await bookingSnapshot()).bookings.find((item) => item.id === id);
  if (!booking || (!actor.admin && (!actor.customerId || booking.customerId !== actor.customerId)))
    throw new TravelError('Booking not found.', 404);
  return booking;
}
async function plan(id: string) {
  const d = travelDatabase();
  await d.run('INSERT INTO trip_plans(booking_id) VALUES($1) ON CONFLICT DO NOTHING', id);
  return (await d.get('SELECT * FROM trip_plans WHERE booking_id=$1', id)) as {
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
export async function travelSnapshot(
  id: string,
  actor: TravelActor,
  publishedOnly = false,
): Promise<TravelSnapshot> {
  const b = await travelBooking(id, actor),
    p = await plan(id),
    d = travelDatabase();
  const services = (
    await d.all('SELECT * FROM trip_services WHERE booking_id=$1 ORDER BY insertion_order', id)
  ).map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    kind: row.kind,
    status: row.status,
    fields: JSON.parse(row.fields as string),
    updatedAt: row.updated_at,
  })) as TravelService[];
  const documents = (await d.all(
    `SELECT x.id,x.service_id "serviceId",x.name,x.mime,x.size FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE s.booking_id=$1 ${actor.admin ? '' : "AND s.status='Confirmed'"} ORDER BY x.insertion_order`,
    id,
  )) as unknown as TravelSnapshot['documents'];
  const notifications = (
    await d.all(
      'SELECT id,message,created_at "createdAt",is_read FROM trip_notifications WHERE booking_id=$1 ORDER BY insertion_order DESC LIMIT 50',
      id,
    )
  ).map((row) => ({
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
async function notification(id: string, message: string) {
  await travelDatabase().run(
    'INSERT INTO trip_notifications(id,booking_id,message,created_at) VALUES($1,$2,$3,$4)',
    randomUUID(),
    id,
    message,
    new Date().toISOString(),
  );
}
async function service(id: string, bookingId: string) {
  const row = await travelDatabase().get(
    'SELECT * FROM trip_services WHERE id=$1 AND booking_id=$2',
    id,
    bookingId,
  );
  if (!row) throw new TravelError('Arrangement not found.', 404);
  return row;
}
export async function mutateTravel(id: string, actor: TravelActor, input: unknown) {
  return travelDatabase().transaction(async () => {
    if (!actor.admin) throw new TravelError('Operator sign-in required.', 403);
    const b = await travelBooking(id, actor);
    if (b.status === 'Cancelled') throw new TravelError('Cancelled bookings are read-only.');
    const body = object(input);
    const d = travelDatabase();
    await plan(id);
    return await d.transaction(async () => {
      if (
        !Number.isInteger(body.revision) ||
        (
          await d.run(
            'UPDATE trip_plans SET revision=revision+1 WHERE booking_id=$1 AND revision=$2',
            id,
            Number(body.revision),
          )
        ).changes !== 1
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
          const previous = await service(serviceId, id);
          if (previous.kind !== kind) throw new TravelError('The service type cannot be changed.');
        }
        await d.run(
          'INSERT INTO trip_services(id,booking_id,kind,status,fields,updated_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET status=excluded.status,fields=excluded.fields,updated_at=excluded.updated_at',
          serviceId,
          id,
          kind,
          status,
          JSON.stringify(fields),
          new Date().toISOString(),
        );
        await notification(
          id,
          `${serviceDefinitions[kind].label} arrangement ${body.id ? 'updated' : 'added'}: ${status}.`,
        );
      } else if (op === 'service-confirm') {
        const row = await service(text(body.id, 100), id);
        if (row.status === 'Cancelled')
          throw new TravelError('Edit the cancelled arrangement before confirming it.');
        validateFields(row.kind as ServiceKind, JSON.parse(row.fields as string), true);
        await d.run(
          "UPDATE trip_services SET status='Confirmed',updated_at=$1 WHERE id=$2",
          new Date().toISOString(),
          String(row.id),
        );
        await notification(
          id,
          `${serviceDefinitions[row.kind as ServiceKind].label} arrangement confirmed.`,
        );
      } else if (op === 'service-delete') {
        const row = await service(text(body.id, 100), id);
        await d.run('DELETE FROM trip_services WHERE id=$1', String(row.id));
        await notification(
          id,
          `${serviceDefinitions[row.kind as ServiceKind].label} arrangement removed. Please review your updated travel details.`,
        );
      } else if (op === 'itinerary-save' || op === 'itinerary-publish') {
        const entries = itinerary(body.itinerary);
        if (op === 'itinerary-publish' && !entries.length)
          throw new TravelError('Add activities before publishing.');
        await d.run(
          'UPDATE trip_plans SET draft=$1 WHERE booking_id=$2',
          JSON.stringify(entries),
          id,
        );
        if (op === 'itinerary-publish') {
          await d.run(
            'UPDATE trip_plans SET published=$1,published_at=$2 WHERE booking_id=$3',
            JSON.stringify(entries),
            new Date().toISOString(),
            id,
          );
          await notification(id, 'Your day-wise itinerary has been published.');
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
        await d.run(
          'UPDATE trip_plans SET coordinator=$1 WHERE booking_id=$2',
          JSON.stringify(contact),
          id,
        );
        await notification(id, 'Your travel coordinator contact details have been updated.');
      } else if (op === 'document-delete') {
        const row = await d.get(
          'SELECT x.id,x.service_id FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE x.id=$1 AND s.booking_id=$2',
          text(body.id, 100),
          id,
        );
        if (!row) throw new TravelError('Document not found.', 404);
        await d.run('DELETE FROM trip_documents WHERE id=$1', String(row.id));
        await d.run(
          "UPDATE trip_services SET status=CASE WHEN status='Confirmed' THEN 'Changed' ELSE status END WHERE id=$1",
          String(row.service_id),
        );
        await notification(
          id,
          'A travel document was removed. Please check your updated arrangements.',
        );
      } else throw new TravelError('Unknown travel operation.');
      return await travelSnapshot(id, actor);
    });
  });
}
export async function uploadTravelDocument(
  id: string,
  actor: TravelActor,
  serviceId: string,
  revision: number,
  name: string,
  mime: string,
  bytes: Uint8Array,
) {
  return travelDatabase().transaction(async () => {
    if (!actor.admin) throw new TravelError('Operator sign-in required.', 403);
    const booking = await travelBooking(id, actor);
    if (booking.status === 'Cancelled') throw new TravelError('Cancelled bookings are read-only.');
    const d = travelDatabase();
    const row = await service(serviceId, id);
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
    return await d.transaction(async () => {
      if (
        !Number.isInteger(revision) ||
        (
          await d.run(
            'UPDATE trip_plans SET revision=revision+1 WHERE booking_id=$1 AND revision=$2',
            id,
            revision,
          )
        ).changes !== 1
      )
        throw new TravelError('This trip changed elsewhere. Refresh before uploading.', 409);
      const usage = (await d.get(
        'SELECT count(*) count,coalesce(sum(x.size),0) total FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE s.booking_id=$1',
        id,
      ))!;
      if (Number(usage.count) >= 50 || Number(usage.total) + bytes.length > 64 * 1024 * 1024)
        throw new TravelError('Trip document limit reached (50 files / 64 MB).');
      await d.run(
        'INSERT INTO trip_documents(id,service_id,name,mime,size,content) VALUES($1,$2,$3,$4,$5,$6)',
        randomUUID(),
        serviceId,
        filename,
        mime,
        bytes.length,
        buffer,
      );
      await d.run(
        "UPDATE trip_services SET status=CASE WHEN status='Confirmed' THEN 'Changed' ELSE status END,updated_at=$1 WHERE id=$2",
        new Date().toISOString(),
        String(row.id),
      );
      await notification(
        id,
        'A ticket or voucher was uploaded. It will be downloadable after the arrangement is confirmed.',
      );
      return await travelSnapshot(id, actor);
    });
  });
}
export async function downloadTravelDocument(documentId: string, actor: TravelActor) {
  const d = travelDatabase();
  const row = await d.get(
    'SELECT x.*,s.booking_id,s.status FROM trip_documents x JOIN trip_services s ON s.id=x.service_id WHERE x.id=$1',
    documentId,
  );
  if (!row) throw new TravelError('Document not found.', 404);
  await travelBooking(String(row.booking_id), actor);
  if (!actor.admin && row.status !== 'Confirmed')
    throw new TravelError('This document is not confirmed.', 404);
  return { name: String(row.name), mime: String(row.mime), bytes: row.content as Uint8Array };
}
export async function readTravelNotices(id: string, actor: TravelActor) {
  await travelBooking(id, actor);
  await travelDatabase().run('UPDATE trip_notifications SET is_read=1 WHERE booking_id=$1', id);
}
