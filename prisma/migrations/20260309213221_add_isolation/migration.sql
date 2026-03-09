-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_travaux_isolation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batimentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "travaux_isolation_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "batiments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_travaux_isolation" ("batimentId", "createdAt", "id", "updatedAt") SELECT "batimentId", "createdAt", "id", "updatedAt" FROM "travaux_isolation";
DROP TABLE "travaux_isolation";
ALTER TABLE "new_travaux_isolation" RENAME TO "travaux_isolation";
CREATE UNIQUE INDEX "travaux_isolation_batimentId_key" ON "travaux_isolation"("batimentId");
CREATE TABLE "new_travaux_isolation_lignes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "travauxIsolationId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" REAL NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "dejaRealise" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "travaux_isolation_lignes_travauxIsolationId_fkey" FOREIGN KEY ("travauxIsolationId") REFERENCES "travaux_isolation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_travaux_isolation_lignes" ("createdAt", "dejaRealise", "designation", "id", "prixUnitaire", "quantite", "travauxIsolationId", "unite", "updatedAt") SELECT "createdAt", "dejaRealise", "designation", "id", "prixUnitaire", "quantite", "travauxIsolationId", "unite", "updatedAt" FROM "travaux_isolation_lignes";
DROP TABLE "travaux_isolation_lignes";
ALTER TABLE "new_travaux_isolation_lignes" RENAME TO "travaux_isolation_lignes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
