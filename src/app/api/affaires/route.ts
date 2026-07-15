import { db, getSessionUserId } from '@/lib/db';
import { getSessionScope, affaireWhereForScope } from '@/lib/authz';
import { NextRequest, NextResponse } from 'next/server';
import { generateAffaireReference } from '@/lib/utils';

// Get affaires — chaque utilisateur voit les siennes + celles de ses équipes,
// l'admin voit tout
export async function GET(_req: NextRequest) {
  try {
    const scope = await getSessionScope();

    const affaires = await db.affaire.findMany({
      where: affaireWhereForScope(scope),
      include: {
        batiments: {
          include: {
            travauxIsolation: { select: { updatedAt: true } },
          },
        },
        parcs: {
          include: {
            chiffrageRef: { select: { updatedAt: true } },
            chiffrageBio: { select: { updatedAt: true } },
          },
        },
        user: { select: { nom: true, prenom: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Dernière modification réelle de l'étude : l'updatedAt de l'Affaire ne bouge
    // que si l'onglet Données générales est édité, or la majorité du travail se
    // fait sur les bâtiments/parcs/chiffrages (routes API séparées). On calcule
    // donc le max sur l'affaire + tous ses enfants pour une vraie temporalité.
    const withLastModified = affaires.map((a: any) => {
      let derniereModification: Date = a.updatedAt;
      const bump = (d: Date | null | undefined) => {
        if (d && d > derniereModification) derniereModification = d;
      };
      for (const b of a.batiments) {
        bump(b.updatedAt);
        bump(b.travauxIsolation?.updatedAt);
      }
      for (const p of a.parcs) {
        bump(p.updatedAt);
        bump(p.chiffrageRef?.updatedAt);
        bump(p.chiffrageBio?.updatedAt);
      }
      return { ...a, derniereModification };
    });

    return NextResponse.json(withLastModified);
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

    // Get DJU for department from database — le front envoie le CODE ('18'),
    // la table stocke aussi le nom : chercher sur les deux (comme /api/meteo)
    const meteo = await db.meteoMoyenne.findFirst({
      where: {
        OR: [{ code: data.departement }, { departement: data.departement }],
      },
    });

    const djuRetenu = data.djuRetenu || meteo?.djuMoyenne || 2400; // Default to 2400 if not found
    // T° extérieure de base du département (feuille Excel Meteo, col. "Text Base")
    const tempExtBase = data.tempExtBase ?? meteo?.tempExtBase ?? -7;

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
        tempExtBase,
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
