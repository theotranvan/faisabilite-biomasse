-- AlterTable
ALTER TABLE "affaires" ADD COLUMN "tarifBoisExploitation" REAL DEFAULT 0.05316;
ALTER TABLE "affaires" ADD COLUMN "tarifElecExploitation" REAL DEFAULT 0.1788;
ALTER TABLE "affaires" ADD COLUMN "tarifFuelExploitation" REAL DEFAULT 0.10;
ALTER TABLE "affaires" ADD COLUMN "tarifGazExploitation" REAL DEFAULT 0.1502;
ALTER TABLE "affaires" ADD COLUMN "villeMonotone" TEXT DEFAULT 'Bourges';

-- AlterTable
ALTER TABLE "parcs" ADD COLUMN "combustibleAppoint" TEXT;
ALTER TABLE "parcs" ADD COLUMN "kmHaieAn" REAL;
ALTER TABLE "parcs" ADD COLUMN "stereAn" REAL;
ALTER TABLE "parcs" ADD COLUMN "volumeCamion" REAL DEFAULT 90;
ALTER TABLE "parcs" ADD COLUMN "volumeSilo" REAL;
