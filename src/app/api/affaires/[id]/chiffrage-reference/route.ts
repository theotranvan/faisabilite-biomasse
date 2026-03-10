import { NextRequest, NextResponse } from 'next/server';
import { db, getDefaultUserId } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const chiffrage = await db.chiffragReference.findFirst({
      where: {
        parc: {
          affaireId: params.id
        }
      }
    });

    return NextResponse.json(chiffrage || {});
  } catch (error: any) {
    console.error('[GET /api/affaires/[id]/chiffrage-reference]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const rawData = await req.json();

    // Normalize data: wizard sends simplified fields, map to schema
    const { parc: _parc, sousTotalChaufferie, emprunt, dureeEmprunt, ...schemaFields } = rawData;
    const data: any = { ...schemaFields };
    // If wizard simplified fields are present, map to schema
    if (!data.lignesChaufferie && sousTotalChaufferie !== undefined) {
      data.lignesChaufferie = JSON.stringify([
        { designation: 'Chaufferie', unite: 'forfait', qte: 1, prixUnitaire: sousTotalChaufferie }
      ]);
    }
    if (!data.lignesIsolation) {
      data.lignesIsolation = data.lignesIsolation || '[]';
    }

    // Vérifier que l'affaire existe
    const affaire = await db.affaire.findFirst({
      where: { id: params.id, userId: await getDefaultUserId() }
    });
    if (!affaire) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find or create first parc for this affaire
    let parc = await db.parc.findFirst({
      where: { affaireId: params.id }
    });
    if (!parc) {
      parc = await db.parc.create({
        data: { affaireId: params.id, numero: 1 }
      });
    }

    // Chercher s'il existe déjà
    const existing = await db.chiffragReference.findFirst({
      where: { parcId: parc.id }
    });

    if (existing) {
      const updated = await db.chiffragReference.update({
        where: { id: existing.id },
        data: data
      });
      return NextResponse.json(updated);
    }

    const chiffrage = await db.chiffragReference.create({
      data: {
        parcId: parc.id,
        ...data
      }
    });

    return NextResponse.json(chiffrage);
  } catch (error: any) {
    console.error('[POST /api/affaires/[id]/chiffrage-reference]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
