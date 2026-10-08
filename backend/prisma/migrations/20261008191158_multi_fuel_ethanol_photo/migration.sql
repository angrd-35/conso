-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "photoFilename" TEXT,
    "defaultFuelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_defaultFuelId_fkey" FOREIGN KEY ("defaultFuelId") REFERENCES "FuelType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ethanolRate" REAL
);

-- CreateTable
CREATE TABLE "FillUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "odometerKm" REAL NOT NULL,
    "fullTank" BOOLEAN NOT NULL DEFAULT true,
    "remainingRangeKm" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FillUp_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FillUpComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fillUpId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "quantityLiters" REAL NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "FillUpComponent_fillUpId_fkey" FOREIGN KEY ("fillUpId") REFERENCES "FillUp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FillUpComponent_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FuelType_name_key" ON "FuelType"("name");

-- CreateIndex
CREATE INDEX "FillUp_vehicleId_date_idx" ON "FillUp"("vehicleId", "date");
