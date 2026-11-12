# Customer login before booking

Flow: Package Book now -> /book/[slug] -> customer login or signup if signed out -> the same package booking form -> submit request -> Admin Bookings and My bookings.

Customer login: /login/customer. Signup: /signup. Account bookings and sign-out: /customer. Package cards and package detail buttons use /book/[slug]. Existing /login links open customer login. Admin and Team stay open as previously requested; customer authentication is separate.

Accounts are stored in the existing users table with role customer. Passwords use salted scrypt hashes. Customer sessions use random tokens stored hashed in the sessions table and an HttpOnly, SameSite=Lax cookie (Secure in production), expiring after 8 hours. Active status and customer role are checked on every protected booking page/API request. Login attempts are limited per email. Return paths only accept local /book/[slug] paths or /customer.

Website booking records are linked to the authenticated customer ID. The account email is taken from the server session, not from the submitted form. The customer portal filters bookings/payments by customer ID. Pre-existing unlinked bookings remain in Admin and are not assigned to an account based only on email.

Signup signs the customer in immediately. No email verification, password-reset email delivery or social login is configured. Existing email addresses are unique across stored account records; users needing recovery can contact the travel team.

Booking requests remain Pending until the team sets pricing and confirms availability. No online payment is collected. Login does not create a booking by itself: the customer chooses dates and submits the booking form. A session-only draft preserves entered booking details if they need to sign in again.

Checks: `npm.cmd run test:customer-auth`; `npm.cmd run test:bookings`; `node scripts/test-postgres.cjs tests/website-booking-http.test.cjs` after `npm.cmd run build`. See [PostgreSQL setup](POSTGRES_MIGRATION.md).

## Customer profile

Signed-in customers can open /customer/profile from My bookings. They can edit their name, phone, city, address and travel preferences. Login email is read-only. Profile records are stored in customer_profiles and scoped to the authenticated account; submitted account IDs and email changes are ignored. Saved name and phone prefill new booking forms. Existing bookings retain their original contact details.

Checks: `npm.cmd run test:customer-profile`; `node scripts/test-postgres.cjs tests/customer-profile-http.test.cjs` after building.
