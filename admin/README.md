# El Buen Sazón admin

Single source of truth for expenses and sales, so decisions come from numbers, not memory.

## Principles
- AI only reads photos/files into structured fields. Every number is re-derived and checked in code, a person confirms, and all analysis is SQL over confirmed rows.
- Money is integer centavos. Confirmed rows are never edited: void and replace. Reports read `status = 'confirmed'` only.

## Stack
Neon Postgres (`buen-sazon-admin`) · Vercel project with root `admin/` on a subdomain · WhatsApp Cloud API intake · Gemini for photo reading.

## Goals / roadmap
1. **Expense intake by WhatsApp photo** (built; pending live test with Meta's test number).
2. Users, roles, trusted devices; web app (PWA) for review, fixes and reports.
3. **Sales:** manual daily close + SoftRestaurant export import (CSV/XLSX; sample export needed).
4. **Uber Eats:** bring delivery sales, commissions and payouts in, so net revenue is real.
   - Start with Uber Eats Manager report/payout exports (CSV), same import path as SoftRestaurant.
   - API access is a later check: Uber's APIs are aimed at approved integration partners, so availability for a single restaurant in Mexico needs confirming.
   - Model gross sales, Uber fees/commission, promotions and net payout separately, tagged `platform = uber_eats`.
   - Avoid double counting: if orders also ring through SoftRestaurant, reconcile them so each sale counts once.
5. Reports: weekly spend by category, daily margin, price history, Monday WhatsApp summary.
6. Facturas (CFDI): tracking and deadlines first, assisted portal flow next, per-store automation only where worth it.
7. Decisions: price-spike alerts, menu-item costing from recipes, break-even and projections.

## Commands
`npm run migrate` · `npm run seed` · `npm test` (needs `DATABASE_URL` in `.env.local`, gitignored)

## Importing the workbook snapshot
`npm run import:workbook -- "<path to 'all sheets' export>"` is a dry run: it parses, cross-checks against the
workbook's own totals and lists warnings. Add `--apply` to write. Re-running is safe (rows carry a `source_key`);
rows you void or enter by hand in the app are never overwritten. Supplier and fixed-cost category mappings live
in `lib/workbook.mjs` (`SUPPLIER_CATEGORY`, `FIXED_CATEGORY`).
Not imported yet: weekly payroll by role, card-fee lines (`% tarjetas`), the daily "Meny"/TE column, and the Hoja1–3 tabs.
