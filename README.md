# Workspace access update

The server database now uses Neon PostgreSQL through the private `DATABASE_URL`. See [database setup, safe SQLite migration, verification, and Vercel deployment](POSTGRES_MIGRATION.md). Run `npm.cmd run db:migrate` before starting the app and use `npm.cmd test` for isolated PostgreSQL tests.

Customer login/signup is required before website booking. Book now returns customers to their selected package after sign-in; `/customer` shows their linked bookings. Admin and Team remain open at `/admin` and `/team`. See [CUSTOMER_BOOKING_AUTH.md](CUSTOMER_BOOKING_AUTH.md).

# Vacation Planners — Website + CRM Dashboard (Frontend Demo)

A multi-page, responsive **Next.js App Router + TypeScript** frontend, based on the _Vacation Planners Expanded Website & CRM Feature Presentation_ supplied for the freelance project.

This project now contains **two distinct experiences in one Next.js application**:

1. The **customer-facing travel website** — destinations, tour packages, day-wise itineraries, gallery, blogs, reviews and enquiry forms.
2. The **internal CRM dashboard demo** — leads, customers, quotations, bookings, payments, follow-up tasks, suppliers, reports and website-content shortcuts.

**IMPORTANT — FRONTEND DEMO, NOT PRODUCTION-SECURE:** The CRM currently has **no authentication, database, API, access controls, real payments, real reservation confirmations or real CRM email delivery**. It uses clearly identified fictional sample records stored in the current browser's `localStorage` for interactive demonstration. **Do not enter actual customer information, publish an unprotected CRM with real data, or send the sample quotations as legitimate offers.**

## Start the project on Windows PowerShell

Install Node.js 20.9 or later (Node 22 recommended), extract the ZIP and open a terminal inside the project folder:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open these URLs:

- **Public website:** http://localhost:3000
- **CRM dashboard:** http://localhost:3000/crm
- **CRM enquiries:** http://localhost:3000/crm/leads
- **CRM quotations:** http://localhost:3000/crm/quotations
- **CRM bookings:** http://localhost:3000/crm/bookings

On macOS/Linux, copy environment settings with `cp .env.example .env.local` instead.

Also included: `DESIGN_PREVIEW.html` (public website preview) and `CRM_DASHBOARD_PREVIEW.html` (standalone static dashboard layout preview). The HTML previews require no npm install and are illustrative only; the Next.js app is the interactive source.

## Customer website pages

| Route                   | Contents                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `/`                     | Premium editorial travel homepage, hero, featured destinations, tours and calls to action |
| `/destinations`         | Destination directory                                                                     |
| `/destinations/[slug]`  | Destination guides and trip ideas                                                         |
| `/packages`             | Searchable and filterable tour cards                                                      |
| `/packages/[slug]`      | Photos, inclusions, itinerary accordions and an enquiry preview                           |
| `/gallery`              | Image gallery with filters, lightbox and keyboard controls                                |
| `/about`                | About the travel company                                                                  |
| `/reviews`              | Genuine-review placeholder (no fabricated testimonials)                                   |
| `/blog`, `/blog/[slug]` | Sample travel guides and articles                                                         |
| `/contact`              | Enquiry form preview and configurable WhatsApp link                                       |

## CRM dashboard pages

| Route             | Interactive frontend features                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `/crm`            | KPI cards, lead pipeline, payment summary, recent enquiries, follow-up checklist                 |
| `/crm/leads`      | Search, filter, create enquiries, change pipeline stages, view enquiry detail drawer, CSV export |
| `/crm/customers`  | Search and filter sample customer profiles, inspect details, CSV export                          |
| `/crm/quotations` | Create quotation drafts from leads, change statuses, CSV export                                  |
| `/crm/bookings`   | Create booking records from quotations, change statuses, view paid vs. outstanding               |
| `/crm/payments`   | Record **sample** payments against bookings, prevent amount above remaining balance, CSV export  |
| `/crm/tasks`      | Create and complete follow-up tasks, search/filter, CSV export                                   |
| `/crm/suppliers`  | Create sample supplier records, search/filter, CSV export                                        |
| `/crm/reports`    | Live-updating mock-data KPIs, pipeline breakdown and cash tracking                               |
| `/crm/content`    | Links to website sections; CMS editing requires backend integration                              |

**Persistence in demo:** CRM changes are saved to localStorage on this device/browser. The dashboard's “Reset sample data” button restores the original fictional records. No changes are shared between users or devices. No user account is created. CSV exports download records from this local sample only.

**Limitations deliberately not simulated:** sending quotation emails, downloading branded quotation PDFs, real booking confirmations, capturing real payments, reminders sent through WhatsApp/email, data synchronization between website and CRM, admin logins, staff roles and permissions, server reports, customer document uploads, and CMS publishing.

## Project structure

```text
src/
  app/
    (website)/            # Public website routes + website-only header/footer layout
    crm/
      layout.tsx          # Dashboard-only sidebar layout and demo data provider
      page.tsx            # Dashboard overview
      [section]/page.tsx  # CRM features: leads, customers, quotations, etc.
      crm.css             # Isolated, responsive CRM design system
    layout.tsx            # Global HTML layout and CSS
    globals.css           # Public website design system
  components/
    crm/
      CrmShell.tsx        # Responsive sidebar, top search, reminders and demo notice
      CrmWorkspace.tsx    # Dashboard views, tables, forms, overlays and reports
    ...                   # Public website reusable components
  features/
    crm/
      demo-data.ts        # Types + fictional sample data
      demo-store.tsx      # Browser-persisted interactive sample state
  data/site.ts            # Travel destinations/packages/sample editorial content
  lib/utils.ts
```

## Quality checks

Run after dependencies are installed:

```powershell
npm run typecheck
npm run lint
npm run build
```

The source has passed a TypeScript/TSX **syntax transpilation check** in the handoff environment. **A complete Next.js build, typecheck, ESLint run and live browser QA are not yet verified**, because the build environment could not access the npm registry. Perform those commands before merging or deploying.

## Required work before real production deployment

1. Add **server-enforced authentication and role-based authorization** (Admin, Manager, Sales). Remove the public `CRM demo` header link or route it through secure login. Never use frontend-only guards to protect customer records.
2. Design and migrate a production database (PostgreSQL) for customers, leads, packages, quotations, bookings, payment records, tasks, staff, suppliers and audit events.
3. Replace browser demo storage with secure server APIs and server-side validated database transactions. Protect public enquiry endpoints with spam controls and rate limits.
4. Connect the public enquiry form to the CRM, with consent, error handling and delivery notifications. Today, the enquiry preview **does not transmit or store** submitted visitor data.
5. Implement real quotation workflow and branded PDF export; booking approval and transaction-safe balance calculations; server audit logs and immutable payment event history.
6. Configure private document/image storage and correct per-role permissions; implement staff ownership, reminder automation and CMS moderation.
7. Replace illustrative photos/trips with client-approved content; publish only reviews and photographs with permission. Verify legal pages, office details and contact info.
8. Install observability and backups, test database restore, implement CI/CD, write unit/integration/e2e tests, and complete accessibility and security review.
9. Review robots/sitemap and metadata before launch. Current app deliberately sends **noindex** and `robots.ts` disallows crawlers.
10. Confirm the scope of optional external payment gateways, flight/hotel APIs and WhatsApp Business automation separately before integrating them.

## Current technical choices

- Next.js App Router, React 19, TypeScript
- Tailwind CSS 4 (public website), isolated CSS for CRM UI
- Framer Motion, Lucide icons
- No added runtime dependency for the CRM demo
- No backend/API/database yet

## Content and scope notes

- No public package pricing has been introduced. The **CRM's internal INR figures are illustrative fictional sample values**, not actual client quotes or package prices.
- WhatsApp chat appears only if `NEXT_PUBLIC_WHATSAPP_NUMBER` contains a valid client-approved number; otherwise its CTA is omitted.
- The sample emails use `example.test` and phone numbers are invented placeholders. Do not contact them.
- Destination photos currently use external Unsplash references; licensed/approved images should replace these before client launch.
- The exact CRM fields, screens and workflow remain subject to Vacation Planners' confirmation under the proposal. This phase implements a realistic frontend demonstration of the requested core CRM modules.

## Code formatting

Use `npm.cmd run format` to apply Prettier and `npm.cmd run format:check` to check formatting. The project uses `.prettierrc.json` and [Prettier ignore rules](https://prettier.io/docs/ignore.html). VS Code format on save is enabled with the recommended Prettier extension. The formatter script prefers a project-local Prettier installation and falls back to the installed VS Code extension when package downloads are unavailable.

# vacation-planners-frontend

#   v a c a t i o n - p l a n n e r s 
 
 
