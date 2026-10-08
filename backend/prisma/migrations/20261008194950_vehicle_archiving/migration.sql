-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "photoFilename" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "defaultFuelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_defaultFuelId_fkey" FOREIGN KEY ("defaultFuelId") REFERENCES "FuelType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "createdAt", "defaultFuelId", "id", "model", "name", "photoFilename", "updatedAt") SELECT "brand", "createdAt", "defaultFuelId", "id", "model", "name", "photoFilename", "updatedAt" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
