# Wines, Winemakers and Waiters

Mobile-first Telegram Mini App front-end MVP.

## Demo
- Waiter, manager and supplier views (role switcher is demo-only).
- English, Russian and Georgian UI.
- Wine offers, per-bottle rewards, sale submission and manager review.

## Local run
`npm install` then `npm run dev`. Production check: `npm run build`.

## Vercel
Framework Vite; build command `npm run build`; output directory `dist`.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor.
3. In Vercel → Project Settings → Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable/anon key only).
4. Redeploy.

Never put the Supabase `service_role` key in Vite or client-side environment variables.

## Security status
The initial schema defines organizations, profiles, memberships, supplier wine offers, restaurant offer links, sales and a bonus ledger with row-level security. It is a foundation, not a production-ready payout system.

Before live use we must add trusted user onboarding/invitations, server-side Telegram initData validation, atomic manager approval plus ledger posting, supplier-fund reservation and payout reconciliation. Do not process real-money payouts with this MVP.
