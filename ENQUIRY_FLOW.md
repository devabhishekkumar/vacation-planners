# Website enquiries to Admin

Customers submit the enquiry form on /contact or a package detail page. A successful submission creates a server-side enquiry and returns a reference. Name, email, phone, destination/package, date, traveller count and requirements appear under /admin/leads with source Website, status New and owner Unassigned.

Admin polls for enquiries every 15 seconds and refreshes when the browser window gains focus. Lead statuses, assignment, notes and follow-up dates are saved to Neon PostgreSQL. Existing local leads are imported without overwriting a server record with the same ID.

The public endpoint returns only a submission reference. Repeated submissions with the same request key are deduplicated. WhatsApp is an optional separate conversation and does not imply a saved enquiry unless the form was submitted successfully.

Storage: PostgreSQL via the private `DATABASE_URL`; see [migration instructions](POSTGRES_MIGRATION.md). Login remains removed as requested. Quotations, tasks and activity history in the legacy dashboard still use browser storage.

Checks: `npm.cmd run test:enquiries`; `node scripts/test-postgres.cjs tests/enquiries-http.test.cjs` (after build).
