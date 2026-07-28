-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ESTIMATED_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE 'ODOMETER_UPDATE_NUDGE';

-- AlterTable
ALTER TABLE "MaintenanceItem" ADD COLUMN     "lastServiceDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "vehicleId" TEXT;

-- CreateTable
CREATE TABLE "OdometerLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reading" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdometerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OdometerLog_vehicleId_recordedAt_idx" ON "OdometerLog"("vehicleId", "recordedAt");

-- AddForeignKey
ALTER TABLE "OdometerLog" ADD CONSTRAINT "OdometerLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
