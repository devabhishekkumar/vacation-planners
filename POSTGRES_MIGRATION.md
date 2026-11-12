# Neon PostgreSQL setup and SQLite cutover

The app uses `pg` in the Next.js Node.js runtime. Set the private `DATABASE_URL` in `.env.local` and in each Vercel environment. Use the Neon pooled connection string with TLS; credentials stay on the server. Node.js 24 or later is required. The pool has five connections per instance, a five-second idle timeout, and Vercel pool lifecycle support. No request reads SQLite or writes a runtime `.data` directory.

## Before cutover

Stop the old app and any workers that can write SQLite. Keep writes paused until import, verification, and deployment have finished. A backup taken while the old app is running is consistent, but cannot include writes made after that backup. The importer does not stop a running server for you.

Keep the original `accounts.sqlite`, its WAL/SHM sidecars, and any existing backups. Do not copy only the main SQLite file while writers are active. The import tool uses Node's SQLite backup API to capture committed WAL content into a standalone backup. Backups and verification reports are retained under the ignored `.data/migration-backups/` directory. Copy them to secure durable storage as well; they contain private account and customer data. `.data` is used only for offline migration artifacts, never by the application.

If Neon already holds data, take a Neon branch/snapshot or a PostgreSQL backup before importing. Test a full import on a separate Neon branch first. Use a separate `DATABASE_URL` for preview deployments rather than the production database.

## Commands

Run from the project root in PowerShell:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run db:verify
npm.cmd run db:import-sqlite -- .data/accounts.sqlite
npm.cmd run db:import-sqlite -- .data/accounts.sqlite --verify-only
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run format
npm.cmd run format:check
```

Use the actual SQLite path if `AUTH_DATA_DIR` previously pointed elsewhere. Scripts load `.env.local` with Next.js environment loading rules and never print connection strings. Schema changes are explicit, versioned, checksum-verified, and applied in a transaction under an advisory lock. Applied migration files must not be edited; add a new numbered SQL migration instead.

The importer checks SQLite integrity and foreign keys and rejects unknown tables or columns. It imports all 17 legacy tables in dependency order, including session tokens, login attempts, users, password hashes, customer profiles, enquiries, activity, leads, bookings, payments, request keys, website content/reviews, trip plans/services/documents/notifications, and the legacy feature migration marker. Existing password hashes, roles, active flags, IDs, JSON text, session expirations and document bytes are copied without transformation. An explicit identity column preserves SQLite insertion order; its sequences are advanced after import.

Each import uses one PostgreSQL transaction and locks the destination tables against concurrent writes. Existing identical rows are verified and skipped. A conflicting primary key, unique key, field value, or constraint aborts the entire data import; there is no overwrite or delete mode. Schema installation is a separate transaction and remains installed after a failed data import. PostgreSQL sequence increments are not transactional, so a rolled-back import may leave harmless gaps. Verification reads every imported field, compares binary content exactly, and records per-table counts and SHA-256 digests. Reports contain no row contents or credentials. Destination-only rows are retained; verified counts describe the source records, not a destructive mirror of the target.

`--verify-only` creates a fresh consistent source backup, checks that every source record exists unchanged in PostgreSQL, and writes a verification report without inserting application data. On a fresh target it may install the schema. Repeating an import against an unchanged source and destination is safe. Once the app starts changing PostgreSQL data, a repeat against an old SQLite snapshot intentionally reports conflicts.

## Authentication and behavior

Password hashing remains salted scrypt with the existing format. No password is reset, no account is seeded, and imported admin/team/customer records retain their roles and active flags. Customer cookies and operator cookies keep their existing names, lifetimes, security flags, hashed-token storage and access checks. `TRAVEL_ADMIN_KEY` remains a separate private environment variable. Legacy unauthenticated workspace routes retain their existing behavior; this migration does not redesign access controls.

Financial writes, imports, booking request deduplication and trip/content revision updates use one connection per transaction. A transaction-scoped advisory lock preserves the serialized write behavior these workflows previously relied on. Parameter values use PostgreSQL placeholders. Private documents use `BYTEA`, not a public filesystem.

Checked-out clients have a connection-error listener in addition to the pool's idle-error listener. Failed transactions explicitly evict their client, release it once in `finally`, and preserve the original failure even if rollback also fails. Async work cannot reuse a client after its transaction has completed. The pool retains its five-connection limit, five-second idle timeout and Vercel lifecycle integration, with TCP keepalive enabled. No queries, writes or transactions are automatically retried; a connection failure around `COMMIT` can leave the outcome uncertain and must not trigger an automatic replay. Registration maps only unique-constraint violations to the duplicate-account message. Connection diagnostics include the failure phase and error code without logging SQL values or credentials.

`tests/postgres-lifecycle.test.cjs` uses the installed `pg` Pool with a controlled transport client to exercise resets while checked out or idle, rollback failures, uncertain commits, nested transactions, and late asynchronous work. It never terminates a real Neon connection. The HTTP test can be repeated in separate disposable schemas with `node scripts/test-postgres.cjs tests/travel-content-http.test.cjs tests/travel-content-http.test.cjs tests/travel-content-http.test.cjs`.

## Vercel deployment

Set `DATABASE_URL` and `TRAVEL_ADMIN_KEY` as private server environment variables, select Node.js 24, and use the normal `npm run build` build command. Run `npm run db:migrate` as a controlled release step before routing traffic to a new release; builds and requests do not change the schema. The one-time SQLite import runs locally where the source database exists, not on Vercel. No persistent Vercel filesystem is required. Redeploy after changing environment variables.

Before reopening traffic, sign in with an existing customer password, check admin/team records, compare booking/payment totals, publish/read trip details, and download an existing document. Preserve the verified backup and report after deployment.

## Tests and rollback

`npm test` creates a randomly named PostgreSQL schema for each test file, applies migrations there, runs the existing tests against it, then drops only that generated schema. The database role needs permission to create schemas. Tests never reset `public` or use the live SQLite file. Individual `test:*` npm scripts use the same isolation. HTTP tests require a successful production build. `DATABASE_SCHEMA` is reserved for test isolation or an intentionally selected deployment schema; leave it unset for the normal `public` schema.

If validation fails before cutover, leave traffic stopped and correct the cause; failed imports roll back application data. To return to SQLite, redeploy the previous SQLite-based code and its original database while no writes have been accepted on PostgreSQL. After PostgreSQL has accepted new writes, reverting code alone would lose those writes: pause traffic, retain both databases, and reconcile/export the newer data first. Do not delete SQLite files or backups merely because a deployment succeeded.
