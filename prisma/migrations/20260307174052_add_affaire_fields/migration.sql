/*
  Warnings:

  - You are about to drop the column `reference` on the `affaires` table. All the data in the column will be lost.
  - You are about to drop the column `villeMonotone` on the `affaires` table. All the data in the column will be lost.
  - Added the required column `referenceAffaire` to the `affaires` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_affaires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "referenceAffaire" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "notes" TEXT,
    "tempExtBase" REAL NOT NULL DEFAULT -7,
    "tempIntBase" REAL NOT NULL DEFAULT 19,
    "djuRetenu" REAL NOT NULL,
    "augmentationFossile" REAL NOT NULL DEFAULT 0.04,
    "augmentationBiomasse" REAL NOT NULL DEFAULT 0.02,
    "tauxEmprunt" REAL NOT NULL DEFAULT 0.02,
    "dureeEmprunt" INTEGER NOT NULL DEFAULT 15,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "affaires_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_affaires" ("adresse", "augmentationBiomasse", "augmentationFossile", "createdAt", "departement", "djuRetenu", "dureeEmprunt", "id", "nomClient", "statut", "tauxEmprunt", "tempExtBase", "tempIntBase", "updatedAt", "userId", "ville") SELECT "adresse", "augmentationBiomasse", "augmentationFossile", "createdAt", "departement", "djuRetenu", "dureeEmprunt", "id", "nomClient", "statut", "tauxEmprunt", "tempExtBase", "tempIntBase", "updatedAt", "userId", "ville" FROM "affaires";
DROP TABLE "affaires";
ALTER TABLE "new_affaires" RENAME TO "affaires";
CREATE UNIQUE INDEX "affaires_referenceAffaire_key" ON "affaires"("referenceAffaire");
CREATE UNIQUE INDEX "affaires_userId_referenceAffaire_key" ON "affaires"("userId", "referenceAffaire");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
