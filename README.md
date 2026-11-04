# Wines, Winemakers and Waiters

Mobile-first Telegram Mini App front-end MVP.

## Demo
- Waiter, manager, supplier and developer views (role switcher and sample data are demo-only).
- English, Russian and Georgian UI.
- Wine offers, per-bottle rewards, sale submission, manager review and a developer commission dashboard preview.
- Platform commission is 10% of the waiter bonus. The restaurant pays this fee separately; it is never deducted from the waiter's reward.

## Local run
`npm install` then `npm run dev`. Production check: `npm run build`.

## Vercel
Framework Vite; build command `npm run build`; output directory `dist`.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor.
3. Run `supabase/migrations/0002_platform_commission.sql` in the Supabase SQL Editor.
4. In Vercel → Project Settings → Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable/anon key only).
5. Redeploy.

Never put the Supabase `service_role` key in Vite or client-side environment variables.

## Commission accounting
- The restaurant commission defaults to 10% of the approved waiter bonus.
- Commission is created only when a restaurant manager approves a sale.
- The full waiter bonus is posted separately to `bonus_ledger`.
- The restaurant's WWW fee is recorded in `platform_fee_ledger`, with the rate and amount snapshotted per sale so later rate changes do not rewrite history.
- `manager_review_sale(sale_id, approve)` performs the sale review and both ledger postings in one database transaction.
- To grant the developer account access to the platform fee ledger, add the authenticated user's UUID to `platform_admins` using the SQL comment at the end of migration 0002.

## Important implementation status
The current visible app still uses demo/in-memory sales and the developer screen is a preview. The SQL ledger and secure database review function are prepared, but actual persistent account data requires Supabase project credentials, user authentication, and wiring the UI to the database. Do not treat demo figures as real accrued commissions or process real-money payouts with this MVP.

iiko integration is intentionally not included yet. The first planned integration target is a locally hosted iiko server.
