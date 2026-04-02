import { db, isAdmin, getSessionUserId } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Get a single affaire
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await getSessionUserId();
    const affaire = await db.affaire.findUnique({
      where: { id },
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
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await getSessionUserId();
    const existingAffaire = await db.affaire.findUnique({
      where: { id },
    });

    if (!existingAffaire) {
      return NextResponse.json(
        { error: 'Affaire not found' },
        { status: 404 }
      );
    }

    const data = await req.json();

    const affaire = await db.affaire.update({
      where: { id },
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

// Delete an affaire (owner or admin)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getSessionUserId();
    const admin = await isAdmin();

    const existingAffaire = await db.affaire.findUnique({
      where: { id },
    });

    if (!existingAffaire) {
      return NextResponse.json(
        { error: 'Affaire not found' },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    if (existingAffaire.userId !== userId && !admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await db.affaire.delete({
      where: { id },
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
