# Website and Admin booking system

Customers choose Book now on a package card or detail page, sign in or sign up if needed, then return to the selected package booking form. Submissions create a Pending record in /admin/bookings with source Website and pricing Awaiting price. They receive a booking reference; no payment is collected.

In Admin, open Details, enter the final total and select Save price. The booking can then be Confirmed. A price must be set before confirmation or completion. Final price cannot be reduced below payments already recorded. Website submissions do not accept customer-supplied amounts or statuses, and retry keys prevent duplicate requests.

Open /admin/bookings and select New booking. Create a direct booking without a quotation, or select an existing local quotation. Enter the customer, journey, dates, traveller count and booking total. Contact details, passenger names and notes are optional.

New records start Pending. Use the status selector to confirm, complete or cancel. Cancellation preserves payment history and cannot be reopened. Refund processing is not implemented.

Open /admin/payments to record advances and subsequent payments with a method and transaction reference. The server prevents payments exceeding the remaining balance and duplicate references on the same booking. No payment gateway is connected; these are received-payment records, not payment collection.

Open a booking's Details action to review customer information, dates, passengers, notes and payment history. The dashboard and reports use the saved booking/payment totals. Data refreshes every 15 seconds, after changes and when the browser window regains focus.

Bookings and payments use Neon PostgreSQL through the private `DATABASE_URL`. Use Node.js 24+ and run `npm.cmd run db:migrate` before starting the app. Follow [POSTGRES_MIGRATION.md](POSTGRES_MIGRATION.md) to preserve existing SQLite data. Existing browser-only bookings are imported on first load; imported records are deduplicated by booking ID and quotation reference. Previous paid balances are retained as payment history/opening balances. Enquiries also use server storage; quotations, tasks and other workspace records still use browser storage.

The public form submits a booking request; it does not automatically reserve supplier inventory. Customer login is required for website booking requests; Admin remains open as previously requested. Do not treat record confirmation as confirmation from a hotel, airline or other travel supplier.

Checks: `npm.cmd run test:bookings`, `node scripts/test-postgres.cjs tests/bookings-http.test.cjs tests/website-booking-http.test.cjs` (requires a completed build), `npm.cmd run typecheck`, `npm.cmd run build`.
