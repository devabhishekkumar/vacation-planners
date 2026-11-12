# CRM demo implementation checklist

- [x] Separate dashboard visual shell under `/crm` (no website header or footer)
- [x] Responsive sidebar + top navigation
- [x] Lead cards, pipeline and recent enquiry table
- [x] Add leads, change lead status, inspect enquiry details
- [x] View and search sample customers
- [x] Add quotation drafts from leads and change status
- [x] Add booking records and track partial payments
- [x] Record sample payments with remaining-balance validation
- [x] Manage and complete follow-up tasks
- [x] Add and list supplier records
- [x] Dynamic sample reports and CSV exports
- [x] Local browser persistence and demo reset
- [x] Standalone dashboard HTML layout preview
- [ ] Production authentication + staff permissions
- [ ] Server APIs, database, file storage and audit trails
- [ ] End-to-end website enquiry → CRM lead sync
- [ ] Branded quotation PDF, client emails and supplier workflows
- [ ] Automated reminders and production reporting
- [ ] CI/CD + full build/TypeScript/ESLint/integration/e2e verification

Security: **This dashboard is an interactive prototype, not a secure internal system**. Do not put real personal or financial data into the browser demo store. Do not make the CRM available with real customer records until server-side access control is implemented.

## CRM assignment and follow-up update

- Added Contacted pipeline stage, editable lead assignment, follow-up date and communication notes.
- Linked task creation updates the lead owner and follow-up date. Lead reassignment updates pending linked tasks.
- Added /crm/admin demo workload and activity overview; this route is not access controlled.
- Added due-today and overdue task filters, sorted reminder lists, and remaining dashboard counters.
- Migrates existing browser demo records by adding an empty activity history.
- Still required: server authentication and roles, employee lifecycle management, durable shared storage, cross-device sync, automatic website enquiry capture, scheduled notifications and PDF quotation generation. Activity entries currently record actions, not authenticated employee identities.

## WhatsApp click-to-chat

- Open an enquiry detail drawer to preview/edit an introduction or follow-up message.
- Open WhatsApp prepares the message; the employee sends it in WhatsApp. No delivery or chat history is inferred.
- Seed contacts with .test email addresses are preview-only.
- Use full international phone numbers including country code. No country code is guessed.
- Public website WhatsApp uses NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local; restart the dev server or rebuild after setting it.
- Automatic sending, shared inbox, replies, media/PDF delivery and delivery receipts require a server-side WhatsApp Business API integration and account configuration.
