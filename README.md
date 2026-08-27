# Vinayaka Chavithi Fund Tracker

Live donation/expense tracker for the colony's Vinayaka Chavithi celebrations: a public
read-only dashboard, admin donation entry with an auto-generated shareable receipt image,
and admin expense entry with bill photo upload.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind) — deployed on Vercel's free Hobby plan.
- **Postgres** via [Neon](https://neon.tech) (Vercel Marketplace integration, free tier) + **Prisma**.
- **Vercel Blob** for bill photo storage.
- Custom cookie-based admin auth (`jose` JWT + `bcryptjs`), no third-party auth service.
- `next/og` `ImageResponse` to render the receipt image server-side (mirrors the colony's paper receipt).
- `swr` for polling the public dashboard every 5s.

## Concurrency design

Many admins can add donations/expenses at the same time, so:

- **Totals are never a stored counter.** The dashboard total is always computed live via a
  Prisma `aggregate` `SUM`/`COUNT` query straight off the `Donation`/`Expense` tables. There is
  no "read total → add → write total" step, so concurrent inserts can't cause a lost update.
- **Receipt/bill numbers are the row's Postgres autoincrement id.** Postgres sequences hand out
  a unique id per `INSERT` even under heavy concurrency, so there's no app-level "last number + 1"
  race condition.
- This is verified by [src/tests/concurrency.test.ts](src/tests/concurrency.test.ts), which fires
  100+ simultaneous donation/expense creations at a real Postgres instance and asserts unique ids
  and an exact aggregate total.

## Local development

1. Start a local Postgres (used for dev + running tests):
   ```bash
   docker compose up -d
   ```
2. Copy the env file and fill in `AUTH_SECRET` (generate with `openssl rand -base64 32`):
   ```bash
   cp .env.example .env
   ```
   The default `DATABASE_URL`/`DIRECT_URL` in `.env.example` already points at the local Docker Postgres.
3. Install dependencies and set up the schema:
   ```bash
   npm install
   npm run db:migrate
   npm run seed   # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env
   ```
4. Run the app:
   ```bash
   npm run dev
   ```
   - Public dashboard: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login

## Tests

```bash
docker compose up -d   # if not already running
npm test
```

## Deploying to Vercel (free Hobby plan)

1. Push this repo to GitHub and import it in the Vercel dashboard.
2. Add the **Neon** integration (Storage tab → Postgres) — this sets `DATABASE_URL`/`DIRECT_URL`
   automatically. Use the pooled connection string for `DATABASE_URL`.
3. Add a **Blob** store (Storage tab → Blob) — this sets `BLOB_READ_WRITE_TOKEN` automatically.
4. Add the remaining env vars in Project Settings → Environment Variables: `AUTH_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ORG_NAME` / `ORG_REG_NO` / `ORG_ADDRESS`.
5. Deploy. Then run the migration + seed once against the production database:
   ```bash
   DATABASE_URL="<neon-pooled-url>" DIRECT_URL="<neon-direct-url>" npx prisma migrate deploy
   ADMIN_EMAIL=... ADMIN_PASSWORD=... DATABASE_URL="<neon-pooled-url>" npm run seed
   ```

All of this fits comfortably in Vercel's free Hobby tier and Neon/Blob's free tiers at the
~300-user, low-traffic scale of a single colony festival.
