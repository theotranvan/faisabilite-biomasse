import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; batimentId: string }> }
) {
  try {
    const { batimentId } = await params;
    const travauxIsolation = await db.travauxIsolation.findUnique({
      where: { batimentId },
      include: { lignes: true },
    });

    return NextResponse.json(travauxIsolation || { lignes: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; batimentId: string }> }
) {
  try {
    const { id, batimentId } = await params;
    const data = await req.json();
    const lignes = data.lignes || [];

    // Vérifier que le bâtiment existe et appartient à l'affaire
    const batiment = await db.batiment.findFirst({
      where: {
        id: batimentId,
        affaireId: id,
      },
    });

    if (!batiment) {
      throw new Error('Bâtiment non trouvé');
    }

    // Récupérer ou créer TravauxIsolation
    let travauxIsolation = await db.travauxIsolation.findUnique({
      where: { batimentId },
    });

    if (!travauxIsolation) {
      travauxIsolation = await db.travauxIsolation.create({
        data: {
          batimentId,
        },
      });
    }

    // Supprimer les anciennes lignes
    await db.travauxIsolationLigne.deleteMany({
      where: { travauxIsolationId: travauxIsolation.id },
    });

    // Créer les nouvelles lignes
    const createdLignes = await Promise.all(
      lignes.map((ligne: any) =>
        db.travauxIsolationLigne.create({
          data: {
            travauxIsolationId: travauxIsolation.id,
            designation: ligne.designation,
            unite: ligne.unite,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            dejaRealise: ligne.dejaRealise || 0,
          },
        })
      )
    );

    // Retourner les données mises à jour
    return NextResponse.json({
      id: travauxIsolation.id,
      batimentId,
      lignes: createdLignes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
