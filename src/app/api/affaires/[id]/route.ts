import { db } from '@/lib/db';
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

// Delete an affaire
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    // Mono-client app - no auth required
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
