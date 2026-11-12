# Website content management

Open **Operations → Website content** and sign in with the private operator key described in [TRAVEL_MANAGEMENT.md](TRAVEL_MANAGEMENT.md).

Edit tour packages, destinations, gallery entries, travel journal articles and shared page images. Add/remove entries, edit inclusions and exclusions, or change the package's day-wise itinerary using normal form fields. Changes stay in the current editor until **Publish website changes** saves the full validated collection and updates the public website. Reload published discards local changes; navigation away may discard unpublished edits.

Publishing stores a versioned document in the PostgreSQL `website_content` table and invalidates website pages. Public lists, detail pages, search filters, metadata, sitemap and booking requests read the published content. Existing content from `src/data/site.ts` remains the default until the first publish. Existing bookings retain their original booking information.

Keep URL names unique and use lowercase letters, digits and hyphens. Every package must reference an existing destination. Update packages before removing or renaming their destination. Images use the existing supported `https://images.unsplash.com/` source or local `/images/` and `/uploads/` assets. The editor accepts image URLs; it does not upload website images. Travel documents are separate, private, and cannot be used as website images.

The editor currently covers the collection content and page photos. Navigation, hardcoded page headings, brand identity, reviews and contact settings retain their existing project workflows.

## Files and endpoints

- `src/features/content/types.ts`: editable collections and field definitions.
- `src/lib/content/service.ts`: published reads, validation, persistence and version checks.
- `src/components/content/ContentEditor.tsx`: responsive search, entry forms, preview and publish controls.
- `src/app/admin/content/`: protected editor in the existing CRM.
- `GET /api/content`: operator-only published snapshot.
- `POST /api/content`: operator-only `{ revision, content }`; validates all entries, publishes atomically and returns HTTP 409 for stale revisions.
- `tests/content-management.test.cjs`: isolated persistence, validation and lookup tests.

Server rendering is enabled for the website so edits appear on the next request without a rebuild. Other visitors already viewing a page see updates on navigation or refresh. Configure the private `DATABASE_URL`, apply schema migrations, and maintain Neon backups as described in [POSTGRES_MIGRATION.md](POSTGRES_MIGRATION.md). Run tests with `node scripts/test-postgres.cjs tests/content-management.test.cjs`.
