-- Replace standalone HYBRID/CNG fuel types with the dual-fuel combos that are
-- actually sold (CNG and hybrid cars are always petrol-based in this market).
ALTER TYPE "FuelType" ADD VALUE IF NOT EXISTS 'PETROL_HYBRID';
ALTER TYPE "FuelType" ADD VALUE IF NOT EXISTS 'PETROL_CNG';

-- Migrate existing rows off the values being removed.
UPDATE "Vehicle" SET "fuelType" = 'PETROL_HYBRID' WHERE "fuelType" = 'HYBRID';
UPDATE "Vehicle" SET "fuelType" = 'PETROL_CNG' WHERE "fuelType" = 'CNG';

-- Postgres can't drop enum values directly, so recreate the type without them.
CREATE TYPE "FuelType_new" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'PETROL_HYBRID', 'PETROL_CNG');
ALTER TABLE "Vehicle" ALTER COLUMN "fuelType" TYPE "FuelType_new" USING ("fuelType"::text::"FuelType_new");
DROP TYPE "FuelType";
ALTER TYPE "FuelType_new" RENAME TO "FuelType";
