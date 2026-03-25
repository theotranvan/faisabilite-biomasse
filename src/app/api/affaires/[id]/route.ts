import { db, isAdmin } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

// Get a single affaire
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    // Mono-client app - no auth required
    const affaire = await db.affaire.findUnique({
      where: { id: params.id },
      include: {
        batiments: true,
        parcs: true,
      },
    });

    if (!affaire) {
      return NextResponse.json(
        { error: 'Affaire not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(affaire);
  } catch (error) {
    console.error('[affaires/[id]/GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an affaire
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    // Mono-client app - no auth required
    const existingAffaire = await db.affaire.findUnique({
      where: { id: params.id },
    });

    if (!existingAffaire) {
      return NextResponse.json(
        { error: 'Affaire not found' },
        { status: 404 }
      );
    }

    const data = await req.json();

    const affaire = await db.affaire.update({
      where: { id: params.id },
      data: {
        nomClient: data.nomClient,
        adresse: data.adresse,
        ville: data.ville,
        departement: data.departement,
        latitude: data.latitude,
        longitude: data.longitude,
        notes: data.notes,
        tempExtBase: data.tempExtBase,
        tempIntBase: data.tempIntBase,
        augmentationFossile: data.augmentationFossile,
        augmentationBiomasse: data.augmentationBiomasse,
        tauxEmprunt: data.tauxEmprunt,
        dureeEmprunt: data.dureeEmprunt,
        statut: data.statut,
        villeMonotone: data.villeMonotone,
        tarifFuelExploitation: data.tarifFuelExploitation != null ? parseFloat(data.tarifFuelExploitation) : undefined,
        tarifGazExploitation: data.tarifGazExploitation != null ? parseFloat(data.tarifGazExploitation) : undefined,
        tarifBoisExploitation: data.tarifBoisExploitation != null ? parseFloat(data.tarifBoisExploitation) : undefined,
        tarifElecExploitation: data.tarifElecExploitation != null ? parseFloat(data.tarifElecExploitation) : undefined,
      },
      include: {
        batiments: true,
        parcs: true,
      },
    });

    return NextResponse.json(affaire);
  } catch (error) {
    console.error('[affaires/[id]/PUT]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an affaire (admin only)
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Seul un administrateur peut supprimer une affaire' }, { status: 403 });
    }

    // Verify the affaire exists
    const existingAffaire = await db.affaire.findUnique({
      where: { id: params.id },
    });

    if (!existingAffaire) {
      return NextResponse.json(
        { error: 'Affaire not found' },
        { status: 404 }
      );
    }

    await db.affaire.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[affaires/[id]/DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
