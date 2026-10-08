-- AlterTable: add station to FillUp
ALTER TABLE "FillUp" ADD COLUMN "station" TEXT;

-- AlterTable: rename price -> pricePerLiter, keeping it as a per-line total for now
ALTER TABLE "FillUpComponent" RENAME COLUMN "price" TO "pricePerLiter";

-- Convert existing total prices into a price-per-liter value
UPDATE "FillUpComponent"
SET "pricePerLiter" = "pricePerLiter" / "quantityLiters"
WHERE "quantityLiters" != 0;
