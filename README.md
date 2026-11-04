# Wines, Winemakers and Waiters

Mobile-first Telegram Mini App front-end MVP.

## Demo
- Waiter, manager and supplier views (role switcher is demo-only).
- English, Russian and Georgian UI.
- Wine offers with per-bottle reward amounts.
- Waiter submits sale with receipt reference.
- Manager approves or rejects pending sales.
- Supplier can add demo offers.
- Telegram WebApp SDK ready/expand integration.

## Local run
`npm install` then `npm run dev`. Production check: `npm run build`.

## Vercel
Framework Vite; build command `npm run build`; output directory `dist`.

## Limitations
This is a front-end demo. Data is in memory and resets on refresh. There is no real Telegram authentication, persistence, permission enforcement, supplier fund reservation, notification, or payout. Do not use for real financial transactions.

Production work: Supabase + RLS, server-side Telegram initData validation, restaurant membership, atomic approval and immutable bonus ledger, payout workflow.
