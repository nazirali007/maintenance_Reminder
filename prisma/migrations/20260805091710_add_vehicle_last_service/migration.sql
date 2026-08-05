-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "lastServiceDate" TIMESTAMP(3),
ADD COLUMN     "lastServiceMileage" INTEGER;

-- Backfill existing rows: assume "last service" = current odometer (full
-- 10,000km runway) since we have no better data for cars added before this
-- column existed.
UPDATE "Vehicle" SET "lastServiceMileage" = "currentMileage" WHERE "lastServiceMileage" IS NULL;

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "lastServiceMileage" SET NOT NULL;
