# Workspace access

Customer login and signup are required for website booking requests. See [CUSTOMER_BOOKING_AUTH.md](CUSTOMER_BOOKING_AUTH.md) for the current flow.

Admin and Team remain open without login. Visit /admin or /team directly. Their management actions remain available without account permissions as previously requested.

The /customer page now requires customer sign-in and shows that customer's linked bookings. Existing records are preserved in .data/accounts.sqlite. Historical password fields and activity are retained.
