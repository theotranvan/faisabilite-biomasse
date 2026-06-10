-- Migration corrective : ajoute les colonnes manquantes sur la base de production
-- Toutes les instructions utilisent IF NOT EXISTS → idempotentes

-- chiffrage_reference
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "lignesIsolation"    TEXT             NOT NULL DEFAULT '[]';
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "lignesChaufferie"   TEXT             NOT NULL DEFAULT '[]';
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxBureauControle" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxMaitriseOeuvre" DOUBLE PRECISION NOT NULL DEFAULT 0.13;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxFraisDivers"    DOUBLE PRECISION NOT NULL DEFAULT 0.02;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxAleas"          DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "montantP2"          DOUBLE PRECISION NOT NULL DEFAULT 750;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "empruntRef"         DOUBLE PRECISION NOT NULL DEFAULT 0;

-- chiffrage_biomasse
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxBureauControle"       DOUBLE PRECISION NOT NULL DEFAULT 0.03;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxMaitriseOeuvre"       DOUBLE PRECISION NOT NULL DEFAULT 0.09;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxFraisDivers"          DOUBLE PRECISION NOT NULL DEFAULT 0.02;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxAleas"                DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "montantP2"                DOUBLE PRECISION NOT NULL DEFAULT 1200;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "consoElecSupplementaire"  DOUBLE PRECISION;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "empruntBio"               DOUBLE PRECISION NOT NULL DEFAULT 0;

-- parcs
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "volumeCamion"       DOUBLE PRECISION DEFAULT 90;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "volumeSilo"         DOUBLE PRECISION;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "kmHaieAn"           DOUBLE PRECISION;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "stereAn"            DOUBLE PRECISION;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "combustibleAppoint" TEXT;

-- batiments
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "coefIntermittence"         DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refDeperditions"           DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refTypeEnergie"            TEXT;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementProduction"    DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementDistribution"  DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementEmission"      DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementRegulation"    DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refTarification"           DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refAbonnement"             DOUBLE PRECISION;
