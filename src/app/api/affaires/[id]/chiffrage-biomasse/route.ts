import { NextRequest, NextResponse } from 'next/server';
import { db, getSessionUserId } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parcNum = req.nextUrl.searchParams.get('parc');
    
    if (parcNum) {
      const parc = await db.parc.findFirst({
        where: { affaireId: params.id, numero: parseInt(parcNum) }
      });
      if (!parc) return NextResponse.json({});
      const chiffrage = await db.chiffrageBiomasse.findFirst({
        where: { parcId: parc.id }
      });
      return NextResponse.json(chiffrage || {});
    }
    
    // Legacy: return all chiffrages keyed by parc number
    const parcs = await db.parc.findMany({
      where: { affaireId: params.id },
      include: { chiffrageBio: true }
    });
    const result: Record<number, any> = {};
    for (const p of parcs) {
      if (p.chiffrageBio) result[p.numero] = p.chiffrageBio;
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GET /api/affaires/[id]/chiffrage-biomasse]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const rawData = await req.json();

    // Strip non-schema fields and map form names to schema names
    const {
      id: _id, parcId: _parcId, createdAt: _ca, updatedAt: _ua,
      affaireId: _aid,
      // Form field names that differ from schema
      charpente, chaudierAppoint, hydraulique, reseauChaleur,
      installationReseauBat, autreTravaux, p2, consoElecSupplement,
      cotEnr, aideDepartementale, detrDsil,
      bureauControle, maitriseOeuvre, fraisDivers, aleas,
      emprunt_biomasse,
      ...schemaFields
    } = rawData;

    const data: any = { ...schemaFields };
    // Map misnamed fields
    if (charpente !== undefined) data.charpenteCouverture = charpente;
    if (chaudierAppoint !== undefined) data.chaudiereAppoint = chaudierAppoint;
    if (hydraulique !== undefined) data.hydrauliqueChaufferie = hydraulique;
    if (reseauChaleur !== undefined) data.reseauChaleurQte = reseauChaleur;
    if (installationReseauBat !== undefined) data.installationReseau = installationReseauBat;
    if (autreTravaux !== undefined) data.autresTravaux = autreTravaux;
    if (p2 !== undefined) data.montantP2 = p2;
    if (consoElecSupplement !== undefined) data.consoElecSupplementaire = consoElecSupplement;
    // Subventions
    if (cotEnr !== undefined) data.tauxSubventionCotEnr = cotEnr;
    if (aideDepartementale !== undefined) data.tauxAideDepartementale = aideDepartementale;
    if (detrDsil !== undefined) data.tauxDetrDsil = detrDsil;
    // Fees
    if (bureauControle !== undefined) data.tauxBureauControle = bureauControle;
    if (maitriseOeuvre !== undefined) data.tauxMaitriseOeuvre = maitriseOeuvre;
    if (fraisDivers !== undefined) data.tauxFraisDivers = fraisDivers;
    if (aleas !== undefined) data.tauxAleas = aleas;

    // Vérifier que l'affaire existe
    const affaire = await db.affaire.findFirst({
      where: { id: params.id, userId: await getSessionUserId() }
    });
    if (!affaire) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find or create parc for this affaire (use ?parc= query param or default to 1)
    const parcNum = parseInt(req.nextUrl.searchParams.get('parc') || '1');
    let parc = await db.parc.findFirst({
      where: { affaireId: params.id, numero: parcNum }
    });
    if (!parc) {
      parc = await db.parc.create({
        data: { affaireId: params.id, numero: 1 }
      });
    }

    // Chercher s'il existe déjà
    const existing = await db.chiffrageBiomasse.findFirst({
      where: { parcId: parc.id }
    });

    if (existing) {
      const updated = await db.chiffrageBiomasse.update({
        where: { id: existing.id },
        data: data
      });
      return NextResponse.json(updated);
    }

    const chiffrage = await db.chiffrageBiomasse.create({
      data: {
        parcId: parc.id,
        ...data
      }
    });

    return NextResponse.json(chiffrage);
  } catch (error: any) {
    console.error('[POST /api/affaires/[id]/chiffrage-biomasse]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
