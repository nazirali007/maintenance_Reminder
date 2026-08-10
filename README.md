# CarSalhakar

Track every vehicle's service history and get reminded before maintenance falls due — by an estimate based on your driving pattern, not just when you happen to open the app.

## What is this ? (Talking About  Project not something else 😂)

Most people forget to get their car serviced on time. You either remember
because something starts sounding wrong, or a mechanic points it out during
an unrelated visit — by which point you may have already driven past the
point where an oil change, brake check, or tyre rotation was actually due.

This app is a simple way to stay ahead of that:

1. **Add your vehicle(s).** Brand, model, current odometer reading — pick
   from real photos and logos, or just type it in.
2. **Log what's been serviced and when**, either item by item (Engine Oil,
   Brakes, Tyres, etc.) or by checking off a simple checklist the next time
   you get work done on the car. Each item can have its own rule — e.g.
   "Engine Oil every 5,000 km" or "Coolant every 40,000 km or 1 year,
   whichever comes first."
3. **The app watches your driving pattern.** Every time you update your
   odometer, it remembers the reading and the date. From that history, it
   can estimate roughly how many kilometers you drive per day.
4. **Even if you forget to open the app for a few weeks**, it uses that
   estimate to guess where your odometer probably is *today*, and checks
   that guess against everything you've told it needs servicing. If
   something looks like it's crossed the line, it emails you — so you find
   out from the app, not from a warning light or a breakdown.
5. **It also gently nags you** to update your real odometer reading every
   couple of weeks, so its guesses stay accurate.

In short: you tell it about your car once, keep it roughly updated, and it
keeps an eye on maintenance so you don't have to remember every interval for
every part yourself.

## Features

- Track multiple vehicles per account, each with brand/model logos and photos
- Per-item maintenance tracking (interval in km and/or a 1-year date window)
- A checklist-style "log a service" flow covering common maintenance items
- Health score and upcoming-maintenance view per vehicle
- Email sign-in via one-time code, plus Google OAuth and password login
- A daily background job that estimates today's odometer reading from your
  driving history and emails you if a service is likely due — even if you
  haven't opened the app in weeks
- A Gemini-powered chat widget scoped to car/vehicle questions, with
  context on the signed-in user's own vehicles and maintenance status

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Turbopack) + React 19
- [Prisma](https://www.prisma.io) + PostgreSQL (developed against [Supabase](https://supabase.com))
- [Auth.js](https://authjs.dev) (Google OAuth, credentials, email OTP)
- [Resend](https://resend.com) for transactional email
- [Gemini API](https://ai.google.dev) (`@google/genai`) for the car-assistant chat widget
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
- A [Gemini API key](https://aistudio.google.com/apikey) (`GEMINI_API_KEY`) for the chat widget

### The daily reminder job

`GET /api/cron/maintenance-check` runs the estimation + reminder logic for every vehicle. It's secret-protected — pass `Authorization: Bearer $CRON_SECRET`. `vercel.json` is already configured to run it once a day if deployed to Vercel; on another host, schedule the same request with cron, a GitHub Action, or a service like cron-job.org.

## Project structure

- `app/(dashboard)/` — authenticated pages (dashboard, vehicles, settings)
- `app/(auth)/` — login, register, password reset
- `app/api/` — route handlers (vehicles, maintenance items, notifications, auth, cron)
- `lib/` — business logic (maintenance due-status calculation, mileage projection, email, validation schemas)
- `prisma/schema.prisma` — data model
