# Maintenance Reminder

Track every vehicle's service history and get reminded before maintenance falls due — by an estimate based on your driving pattern, not just when you happen to open the app.

## Features

- Track multiple vehicles per account, each with brand/model logos and photos
- Per-item maintenance tracking (interval in km and/or a 1-year date window)
- A checklist-style "log a service" flow covering common maintenance items
- Health score and upcoming-maintenance view per vehicle
- Email sign-in via one-time code, plus Google OAuth and password login
- A daily background job that estimates today's odometer reading from your
  driving history and emails you if a service is likely due — even if you
  haven't opened the app in weeks

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Turbopack) + React 19
- [Prisma](https://www.prisma.io) + PostgreSQL (developed against [Supabase](https://supabase.com))
- [Auth.js](https://authjs.dev) (Google OAuth, credentials, email OTP)
- [Resend](https://resend.com) for transactional email
- Tailwind CSS v4 + shadcn/ui (base-ui primitives) + `react-hook-form` + `zod`

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in the values described below
npx prisma migrate dev
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for the full list and where to get each value. In short, you'll need:

- A Postgres database (`DATABASE_URL` / `DIRECT_URL`)
- `AUTH_SECRET` — generate with `openssl rand -base64 33`
- Google OAuth credentials (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`)
- A [Resend](https://resend.com) API key (`RESEND_API_KEY`, `EMAIL_FROM`) for OTP/password-reset/reminder emails
- `CRON_SECRET` — generate the same way as `AUTH_SECRET`; protects the daily reminder job

### The daily reminder job

`GET /api/cron/maintenance-check` runs the estimation + reminder logic for every vehicle. It's secret-protected — pass `Authorization: Bearer $CRON_SECRET`. `vercel.json` is already configured to run it once a day if deployed to Vercel; on another host, schedule the same request with cron, a GitHub Action, or a service like cron-job.org.

## Project structure

- `app/(dashboard)/` — authenticated pages (dashboard, vehicles, settings)
- `app/(auth)/` — login, register, password reset
- `app/api/` — route handlers (vehicles, maintenance items, notifications, auth, cron)
- `lib/` — business logic (maintenance due-status calculation, mileage projection, email, validation schemas)
- `prisma/schema.prisma` — data model
