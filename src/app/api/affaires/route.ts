import { db, getSessionUserId } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateAffaireReference } from '@/lib/utils';

// Get all affaires (shared workspace — all users see all affaires)
export async function GET(_req: NextRequest) {
  try {
    await getSessionUserId(); // ensure authenticated

    const affaires = await db.affaire.findMany({
      include: {
        batiments: true,
        parcs: true,
        user: { select: { nom: true, prenom: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(affaires);
  } catch (error) {
    console.error('[affaires/GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new affaire
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();

    const data = await req.json();

    // Validate required fields
    if (!data.nomClient || !data.ville || !data.departement) {
      const missing = [];
      if (!data.nomClient) missing.push('Nom du client');
      if (!data.ville) missing.push('Ville');
      if (!data.departement) missing.push('Département');
      return NextResponse.json(
        { error: `Champs obligatoires manquants : ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Get DJU for department from database
    const meteo = await db.meteoMoyenne.findFirst({
      where: { departement: data.departement },
    });

    const djuRetenu = meteo?.djuMoyenne || 2400; // Default to 2400 if not found

    // Generate reference
    const referenceAffaire = generateAffaireReference();

    // Assign to user's first team if they belong to one
    const userWithTeams = await db.user.findUnique({
      where: { id: userId },
      include: { equipes: { select: { id: true } } },
    });
    const equipeId = data.equipeId || userWithTeams?.equipes[0]?.id || null;

    const affaire = await db.affaire.create({
      data: {
        userId,
        equipeId,
        referenceAffaire,
        nomClient: data.nomClient,
        adresse: data.adresse,
        ville: data.ville,
        departement: data.departement,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        notes: data.notes || null,
        tempExtBase: data.tempExtBase || -7,
        tempIntBase: data.tempIntBase || 19,
        djuRetenu,
        augmentationFossile: data.augmentationFossile || 0.04,
        augmentationBiomasse: data.augmentationBiomasse || 0.02,
        tauxEmprunt: data.tauxEmprunt || 0.02,
        dureeEmprunt: data.dureeEmprunt || 15,
        villeMonotone: data.villeMonotone || 'Bourges',
        statut: 'BROUILLON',
      },
    });

    return NextResponse.json(affaire, { status: 201 });
  } catch (error) {
    console.error('[affaires/POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
