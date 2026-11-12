# Post-booking travel management

## Setup

Use Node.js 24 or later. Configure `DATABASE_URL` and run `npm.cmd run db:migrate`; see [PostgreSQL setup and SQLite cutover](POSTGRES_MIGRATION.md). Set `TRAVEL_ADMIN_KEY` in `.env.local` (or the production server environment) to a random secret of at least 24 characters, then restart the application. For example, generate a key locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Never use a `NEXT_PUBLIC_` variable for this key.

Open **Workspace → Trip management** or **Bookings → Manage Travel**. Unlock with the operator key. This feature-specific admin session lasts eight hours and uses an HttpOnly cookie. The same sign-in protects the Website content editor. Customers continue to use their existing accounts.

Existing Admin/Team screens and booking APIs are unauthenticated in this demo. They have deliberately not been redesigned or retrofitted. Restrict access to those legacy endpoints before public production deployment. The new travel APIs and documents require authorization independently.

## Feature files

| Location                             | Responsibility                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `src/features/travel/types.ts`       | Service models, statuses and form definitions                                 |
| `src/lib/travel/database.ts`         | Shared PostgreSQL connection access                                           |
| `src/lib/travel/service.ts`          | Validation, ownership, CRUD, confirmation, publishing, uploads, notifications |
| `src/lib/travel/operator.ts`         | Private operator session and login throttling                                 |
| `src/lib/travel/http.ts`             | Authentication, bounded request bodies, origin checks, errors                 |
| `src/lib/travel/pdf.ts`              | Published itinerary PDF                                                       |
| `src/components/travel/`             | Shared layout, service forms, itinerary editor/timeline, operator sign-in     |
| `src/app/admin/travel/`              | Admin trip list and booking management                                        |
| `src/app/customer/travel/`           | Customer trip list and private travel details                                 |
| `tests/travel-management.test.cjs`   | Isolated PostgreSQL integration checks                                        |
| `tests/travel-content-http.test.cjs` | Production HTTP integration checks                                            |

## Database migration

Versioned PostgreSQL migrations run explicitly through `npm.cmd run db:migrate`. They create the trip tables, indexes and constraints alongside the other application tables. The offline SQLite importer preserves existing records, including WAL data. Plans reference existing `travel_bookings.id`; customer ownership comes exclusively from the booking's existing `customerId`. Unlinked admin bookings are shown to operators but are never matched to customers by a guessed email or phone.

Documents are private PostgreSQL `BYTEA` values, not public files. Neon supplies durable storage; no persistent application disk is needed. Retain original SQLite databases and migration backups until integrity and cutover have been verified.

## Workflow

1. Open a booking and select a service tab. Add any number of trains/flights, hotels, taxis, meals or activities.
2. Save a Pending or Changed arrangement. **Confirm** validates the required reservation details. Driver information may be filled later; a taxi cannot be confirmed until assigned.
3. Upload PDF, PNG or JPEG tickets/vouchers (8 MB per file, 50 files / 64 MB per trip). File signatures and MIME types must match. Uploading or removing a document on a confirmed service marks it Changed; confirm again after review.
4. Build the itinerary, reorder activities with Move up/down, save private drafts, and publish explicitly. Customer views and PDF downloads show the last published version, even while a new draft is being edited. Times are the local times entered by the operator.
5. Add a travel coordinator. Customers see support contacts, statuses, published activities and confirmed documents. Customer pages refresh every 15 seconds. Customers cannot modify services, documents, contacts or itineraries.
6. Service changes create booking-linked notifications. Customers can mark them read. The support tab can open a prepared WhatsApp message using an international customer number. It never claims delivery or sends automatically. There is no configured email/WhatsApp delivery provider in this project.

Cancelled bookings are read-only. Delete actions require UI confirmation. Concurrent updates use revision checks and return HTTP 409; refresh before retrying. No customer files or API responses are publicly cached. Documents download as attachments with `nosniff` and sandbox headers. Current PDF text uses Latin/ASCII characters; original documents retain their original content.

## API

- `GET/POST/DELETE /api/travel/session`: operator access status, sign-in and sign-out.
- `GET /api/travel/:bookingId`: authorized snapshot; customers only receive published itinerary and confirmed documents.
- `POST /api/travel/:bookingId`: JSON operations `service-save`, `service-confirm`, `service-delete`, `itinerary-save`, `itinerary-publish`, `coordinator`, `document-delete`, or `notices-read`. Mutations need the current `revision`; only notices-read is available to customers.
- `POST /api/travel/:bookingId`: multipart `file`, `serviceId`, `revision` for upload.
- `GET /api/travel/documents/:documentId`: authorized document download.
- `GET /api/travel/:bookingId/itinerary`: authorized PDF of the last published itinerary.

## Checks

```powershell
node scripts/test-postgres.cjs tests/travel-management.test.cjs tests/content-management.test.cjs
npm.cmd run build
node scripts/test-postgres.cjs tests/travel-content-http.test.cjs
npm.cmd run typecheck
npm.cmd run format
npm.cmd run format:check
```

The tests use disposable databases, never the live `.data` directory. Manually check operator sign-in, each service tab, document upload/confirm/download, published versus draft itinerary, a second customer account, and mobile layouts. Login throttling is intentionally global for the shared operator key; configure gateway-level abuse controls for a public deployment.
