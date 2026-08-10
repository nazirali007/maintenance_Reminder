-- Prevents duplicate UNREAD reminders for the same item/vehicle+type when
-- two near-simultaneous requests (e.g. an odometer update's instant check
-- and the dashboard-load sync it triggers) both see "no existing unread
-- notification" before either one's insert has committed. Partial indexes
-- because a new notification of the same type SHOULD be allowed once the
-- old one is marked READ.
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_unread_item_type_key"
  ON "Notification" ("maintenanceItemId", "type")
  WHERE "status" = 'UNREAD' AND "maintenanceItemId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Notification_unread_vehicle_type_key"
  ON "Notification" ("vehicleId", "type")
  WHERE "status" = 'UNREAD' AND "maintenanceItemId" IS NULL AND "vehicleId" IS NOT NULL;
