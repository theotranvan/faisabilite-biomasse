-- CreateTable TravauxIsolation
CREATE TABLE "travaux_isolation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batimentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "travaux_isolation_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "batiments" ("id") ON DELETE CASCADE
);

-- CreateTable TravauxIsolationLigne
CREATE TABLE "travaux_isolation_lignes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "travauxIsolationId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" REAL NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "dejaRealise" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "travaux_isolation_lignes_travauxIsolationId_fkey" FOREIGN KEY ("travauxIsolationId") REFERENCES "travaux_isolation" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "travaux_isolation_batimentId_key" ON "travaux_isolation"("batimentId");
