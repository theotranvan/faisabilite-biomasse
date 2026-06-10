import { NextResponse } from 'next/server';
import { db, isAdmin } from '@/lib/db';

const MIGRATION_SQL = `
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "lignesIsolation"    TEXT             NOT NULL DEFAULT '[]';
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "lignesChaufferie"   TEXT             NOT NULL DEFAULT '[]';
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxBureauControle" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxMaitriseOeuvre" DOUBLE PRECISION NOT NULL DEFAULT 0.13;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxFraisDivers"    DOUBLE PRECISION NOT NULL DEFAULT 0.02;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "tauxAleas"          DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "montantP2"          DOUBLE PRECISION NOT NULL DEFAULT 750;
ALTER TABLE "chiffrage_reference" ADD COLUMN IF NOT EXISTS "empruntRef"         DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxBureauControle"      DOUBLE PRECISION NOT NULL DEFAULT 0.03;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxMaitriseOeuvre"      DOUBLE PRECISION NOT NULL DEFAULT 0.09;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxFraisDivers"         DOUBLE PRECISION NOT NULL DEFAULT 0.02;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "tauxAleas"               DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "montantP2"               DOUBLE PRECISION NOT NULL DEFAULT 1200;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "consoElecSupplementaire" DOUBLE PRECISION;
ALTER TABLE "chiffrage_biomasse" ADD COLUMN IF NOT EXISTS "empruntBio"              DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "volumeCamion"       DOUBLE PRECISION DEFAULT 90;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "volumeSilo"         DOUBLE PRECISION;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "kmHaieAn"           DOUBLE PRECISION;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "stereAn"            DOUBLE PRECISION;
ALTER TABLE "parcs" ADD COLUMN IF NOT EXISTS "combustibleAppoint" TEXT;

ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "coefIntermittence"        DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refDeperditions"          DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refTypeEnergie"           TEXT;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementProduction"   DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementDistribution" DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementEmission"     DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refRendementRegulation"   DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refTarification"          DOUBLE PRECISION;
ALTER TABLE "batiments" ADD COLUMN IF NOT EXISTS "refAbonnement"            DOUBLE PRECISION;
`;

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }

  try {
    const statements = MIGRATION_SQL
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('ALTER TABLE'));

    let applied = 0;
    for (const sql of statements) {
      await db.$executeRawUnsafe(sql);
      applied++;
    }

    return NextResponse.json({ success: true, applied, message: `${applied} colonnes vérifiées/ajoutées` });
  } catch (error: any) {
    console.error('[POST /api/admin/migrate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
