@AGENTS.md
# Project context

Car maintenance app. Stack: [Node/Django/etc], DB: [Postgres/Mongo/etc]

## Service reminder logic (spec)
- Service is due when EITHER:
  - odometer since last service >= 10000km, OR
  - 1 year has passed since last service date
- Problem: we only checked this when the user manually updated odometer,
  so if they don't open the app, we miss the threshold.

## Fix to implement
1. Add `odometer_logs` table: car_id, reading, date
2. Compute rolling average km/day from last 3-5 log entries
3. Daily cron job per car:
   estimated_km = last_known_reading + (rate * days_since_last_update)
   if estimated_km - service_odometer >= 10000 OR today - last_service_date >= 365 days:
       send reminder notification
4. Send a lightweight "please update odometer" nudge every 15-20 days
5. Fallback rate (~30km/day) if a car has <2 log entries