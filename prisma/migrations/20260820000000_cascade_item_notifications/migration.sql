-- Deleting a MaintenanceItem used to SET NULL on its notifications'
-- maintenanceItemId. That turned an item-level row into something matching
-- the vehicle-level partial unique index from
-- 20260810000000_notification_unread_uniqueness
-- (status='UNREAD' AND "maintenanceItemId" IS NULL AND "vehicleId" IS NOT NULL),
-- so deleting an item while both it and its vehicle had an unread reminder of
-- the same type failed with a unique-constraint violation — surfacing to the
-- user as "Something went wrong".
--
-- Cascade instead: a reminder that says "Engine Oil is overdue" has no meaning
-- once Engine Oil is no longer tracked, so it should go with it.

-- Clear rows already orphaned by the old SET NULL behaviour: they're
-- indistinguishable from vehicle-level reminders and would otherwise linger in
-- the bell forever with no way to resolve them.
DELETE FROM "Notification"
WHERE "maintenanceItemId" IS NULL
  AND "vehicleId" IS NOT NULL
  AND "type" IN ('OVERDUE', 'DUE_SOON', 'ESTIMATED_OVERDUE')
  AND "id" NOT IN (
    SELECT DISTINCT ON ("vehicleId", "type") "id"
    FROM "Notification"
    WHERE "maintenanceItemId" IS NULL
      AND "vehicleId" IS NOT NULL
      AND "type" IN ('OVERDUE', 'DUE_SOON', 'ESTIMATED_OVERDUE')
    ORDER BY "vehicleId", "type", "createdAt" DESC
  );

ALTER TABLE "Notification" DROP CONSTRAINT "Notification_maintenanceItemId_fkey";

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_maintenanceItemId_fkey"
  FOREIGN KEY ("maintenanceItemId") REFERENCES "MaintenanceItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
