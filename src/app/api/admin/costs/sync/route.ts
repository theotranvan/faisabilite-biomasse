import { NextResponse } from 'next/server';
import { db, isAdmin } from '@/lib/db';
import { bddCoutsData } from '@/lib/data/bddCouts';

// Réinjecte la base de coûts complète (issue de l'Excel) sans rien écraser :
// `skipDuplicates` ajoute uniquement les postes absents (clé unique
// categorie+designation), donc les prix personnalisés par le client sont conservés.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }

  const before = await db.bddCout.count();
  const res = await db.bddCout.createMany({ data: bddCoutsData, skipDuplicates: true });
  const after = await db.bddCout.count();

  return NextResponse.json({
    success: true,
    ajoutes: res.count,
    total: after,
    message: `${res.count} poste(s) ajouté(s) — base de coûts à ${after} postes (était ${before}). Prix existants conservés.`,
  });
}
