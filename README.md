# NCCS Pizza Fridays

A weekly Friday pizza-lunch ordering app for New Covenant Christian School. Parents
place and pay for a per-student order (slices, whole pizzas, breadsticks); the
school gets a real-time dashboard of exactly how many whole pizzas (by type) and
breadstick orders to buy, plus a delivery list by classroom.

## Current status

- **Live at:** https://ncc-pizza.vercel.app
- **Database:** production Neon Postgres, seeded with default prices only (no
  fake demo data)
- **Email:** real, via Gmail SMTP (an app password on a personal Gmail account —
  see "Payments and email" below for why, and how to move to a real domain later)
- **Payments:** still mock mode — no Square account exists yet, so no real
  charges happen. This is the main thing blocking a real launch; see below.
- Admin password is saved outside this repo (in a password manager) — not
  written down here on purpose.

## Stack

- **Next.js (App Router, TypeScript)** — single full-stack app, deployed on Vercel
- **Prisma + Postgres** (e.g. [Neon](https://neon.tech)) — `DATABASE_URL` points at
  a standard Postgres connection string
- **Square** Web Payments SDK / Payments API for checkout, with a built-in mock
  payment path when no Square credentials are configured
- **Nodemailer** for confirmation emails, with a built-in mock path (persisted to
  an admin-visible Mock Inbox) when no SMTP credentials are configured
- **Tailwind CSS**, **Vitest** for unit tests

## Local development: keep this folder off iCloud Drive

This project lives at `~/Developer/ncc-pizza`, not under `~/Desktop` or
`~/Documents`, on purpose. Those folders sync to iCloud Drive by default on
macOS, and iCloud trying to sync the ~40,000+ files in `node_modules`
(especially the Square SDK, which alone has thousands of small type-definition
files) fought file access with `next build`'s TypeScript check badly enough to
turn a normal ~5-second build into 15+ minutes. If you ever move this project,
keep it somewhere outside iCloud-synced folders.

## One-time setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL with a Postgres connection string
npx prisma migrate dev --name init   # creates tables and runs migrations
npm run db:seed        # (re)seeds default prices + demo data — safe to re-run
```

`npm run db:seed` creates demo orders with fake parent data — use it for local
dev only. For a real database (e.g. right after first deploying), run
`npm run db:seed:prod` instead — it only creates the default price rows, no
fake orders.

The seeded `.env` ships with a working dev admin password: **`pizza2026`**. To set
your own, generate a hash and paste the printed line into `.env` (or your host's
environment variables) as `ADMIN_PASSWORD_HASH_BASE64`:

```bash
npx tsx scripts/hash-password.ts "yourpassword"
```

The value is base64-encoded rather than a raw bcrypt hash on purpose: bcrypt
hashes contain `$` characters, and several env var systems — including Next.js's
own env loader, and inconsistently Vercel's — treat `$word` inside a value as a
reference to another variable and silently corrupt it. Base64 never contains `$`,
so there's nothing to escape, on any host.

## Running the app

```bash
npm run dev
```

Open `http://localhost:3000` for the parent order form, `http://localhost:3000/admin`
for the admin dashboard (password-protected).

## Testing

```bash
npm test
```

Unit tests cover the Friday ordering-window date math (`src/lib/friday.ts`) and
the pizza-needed rounding math (`src/lib/pizzaMath.ts`) — the two places
correctness matters most.

## How ordering works

- Every Friday is a pizza day by default. Ordering for the upcoming Friday is open
  from whenever the previous week's ordering closed until **11:59 PM Wednesday**,
  evaluated in the `SCHOOL_TIMEZONE` env var (default `America/New_York`) — not the
  server's runtime timezone. There's no cron job: "is ordering open" is computed
  fresh from the current time on every request.
- Admins can mark a specific Friday "skipped" (holidays/breaks) under
  **Admin → Schedule**. If the upcoming Friday is skipped, the parent page shows an
  explicit "no pizza this Friday" message for that date (rather than silently
  jumping the form to the following week) plus a preview of when the next order
  window opens.
- Prices are stored in the database (**Admin → Pricing**), not hardcoded, and are
  editable without a code change. Each order snapshots the 7 unit prices at
  checkout time, so editing prices later never changes the total on an
  already-placed order.
- "Pizzas needed" math (shown on the admin dashboard): `ceil(total slices ordered
  / 8) + whole pizzas ordered`, per type. Breadsticks/snacks/drinks are simple sums.
- Each student has a **grade** (K–12, dropdown). The **drink** menu item is only
  offered to secondary students (grades 6–12) — enforced both in the UI (the
  option is hidden for elementary grades) and server-side in `POST /api/orders`
  (see `isSecondaryGrade` in `src/lib/constants.ts`), so it can't be bypassed by
  calling the API directly.

## Payments and email: mock mode vs. real

Both integrations support a clearly-labeled **mock mode** out of the box, so the
full order → pay → confirm → admin-dashboard flow is testable locally with zero
external accounts:

- **No `SQUARE_ACCESS_TOKEN`/`SQUARE_LOCATION_ID` set** → orders are recorded
  as paid via a mock path (`paymentMode: "mock"` in the database and admin
  dashboard), no real charge happens, and the parent-facing button reads "Place
  order (test mode)". **This is the current state in production** — no Square
  account exists yet. Once one does, set the `SQUARE_*` and
  `NEXT_PUBLIC_SQUARE_*` vars (sandbox first, then production) — real charges
  start automatically, no code changes needed.
- **No `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` set** → confirmation emails are
  logged to the console and saved to **Admin → Mock Inbox** instead of sent.

  **Production currently uses real SMTP** via a personal Gmail account (an
  [App Password](https://myaccount.google.com/apppasswords), not the account
  password — requires 2-Step Verification enabled first):
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=<the gmail address>
  SMTP_PASS=<16-character app password, no spaces>
  SMTP_FROM="NCCS Pizza Fridays <the gmail address>"
  ```
  This was the fallback because no one had DNS access to a domain to verify with
  a transactional email provider (Resend, etc.) yet. Two reasons to move off it
  eventually: Gmail SMTP has a ~500 emails/day sending cap (fine for now, a
  school's weekly volume is nowhere close), and parents see a personal Gmail
  address as the sender rather than something official-looking. To switch to a
  real provider later: verify any domain you control in Resend (or similar) —
  it does **not** need to be where the site is hosted, and does **not** need a
  real mailbox behind it, just DNS records proving control — then swap the
  `SMTP_*` vars to that provider's values and update `SMTP_FROM` to an address
  on the verified domain. No code changes either way.

## Deploying (Vercel)

1. Push this repo to GitHub, then import it into Vercel.
2. Set the environment variables from `.env.example` in the Vercel project settings
   (production `DATABASE_URL`, `ADMIN_PASSWORD_HASH_BASE64`, a strong random
   `ADMIN_JWT_SECRET`, `SQUARE_*`/`SMTP_*` once you have them, etc). Avoid ever
   putting a raw `$`-containing value (like a bcrypt hash) directly into a Vercel
   env var — in testing, it got corrupted inconsistently regardless of the
   Secret/Config type. `ADMIN_PASSWORD_HASH_BASE64` sidesteps this entirely since
   base64 never contains `$`.
3. `npm run postinstall` (→ `prisma generate`) runs automatically on every Vercel
   build. Migrations do **not** run automatically — run
   `npm run db:migrate:deploy` (wraps `prisma migrate deploy`) against the
   production `DATABASE_URL` once after each deploy that changes `prisma/schema.prisma`.
4. First deploy only: run `npm run db:seed:prod` once against the production
   database to create the default price rows.

## Project structure

```
prisma/           Prisma schema, migrations, seed script
src/
  proxy.ts         Admin auth gate (Next.js 16 renamed middleware.ts → proxy.ts)
  app/             Pages (parent order form, confirmation, /admin/*) and API routes
  components/      UI components (order form, admin dashboard widgets)
  lib/             Core logic: friday.ts (date math), pizzaMath.ts, pricing.ts,
                   square.ts, email.ts, auth.ts, orderExport.ts
```

See [`src/lib/friday.ts`](src/lib/friday.ts) for the ordering-window date math and
[`src/lib/pizzaMath.ts`](src/lib/pizzaMath.ts) for the pizzas-needed rounding —
both are pure functions with unit tests alongside them.

## Out of scope for v1

Parent accounts/login, standing/recurring weekly orders, toppings beyond
cheese/pepperoni, automated reminder emails before the Wednesday cutoff (flagged
as a possible v2 feature), multi-school support.
