import { NextRequest, NextResponse } from 'next/server';
import { db, getSessionUserId } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parcNum = req.nextUrl.searchParams.get('parc');
    
    if (parcNum) {
      // Fetch for specific parc
      const parc = await db.parc.findFirst({
        where: { affaireId: id, numero: parseInt(parcNum) }
      });
      if (!parc) return NextResponse.json({});
      const chiffrage = await db.chiffragReference.findFirst({
        where: { parcId: parc.id }
      });
      return NextResponse.json(chiffrage || {});
    }
    
    // Legacy: return all chiffrages keyed by parc number
    const parcs = await db.parc.findMany({
      where: { affaireId: id },
      include: { chiffrageRef: true }
    });
    const result: Record<number, any> = {};
    for (const p of parcs) {
      if (p.chiffrageRef) result[p.numero] = p.chiffrageRef;
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GET /api/affaires/[id]/chiffrage-reference]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Mono-client app - no auth required
    const rawData = await req.json();

    // Strip non-schema fields sent by frontend
    const {
      parc: _parc, sousTotalChaufferie, emprunt, dureeEmprunt,
      id: _id, parcId: _parcId, createdAt: _ca, updatedAt: _ua,
      affaireId: _aid,
      ...rest
    } = rawData;

    // Map form field names to schema field names
    const data: any = {};
    // lignesChaufferie
    if (rest.travauxChaufferie) {
      data.lignesChaufferie = typeof rest.travauxChaufferie === 'string'
        ? rest.travauxChaufferie
        : JSON.stringify(rest.travauxChaufferie);
    } else if (rest.lignesChaufferie) {
      data.lignesChaufferie = typeof rest.lignesChaufferie === 'string'
        ? rest.lignesChaufferie
        : JSON.stringify(rest.lignesChaufferie);
    } else if (sousTotalChaufferie !== undefined) {
      data.lignesChaufferie = JSON.stringify([
        { designation: 'Chaufferie', unite: 'forfait', qte: 1, prixUnitaire: sousTotalChaufferie }
      ]);
    } else {
      data.lignesChaufferie = '[]';
    }
    // lignesIsolation
    if (rest.lignesIsolation) {
      data.lignesIsolation = typeof rest.lignesIsolation === 'string'
        ? rest.lignesIsolation
        : JSON.stringify(rest.lignesIsolation);
    } else {
      data.lignesIsolation = '[]';
    }
    // Fee rates
    if (rest.bureauControle !== undefined) data.tauxBureauControle = rest.bureauControle;
    if (rest.tauxBureauControle !== undefined) data.tauxBureauControle = rest.tauxBureauControle;
    if (rest.maitriseOeuvre !== undefined) data.tauxMaitriseOeuvre = rest.maitriseOeuvre;
    if (rest.tauxMaitriseOeuvre !== undefined) data.tauxMaitriseOeuvre = rest.tauxMaitriseOeuvre;
    if (rest.fraisDivers !== undefined) data.tauxFraisDivers = rest.fraisDivers;
    if (rest.tauxFraisDivers !== undefined) data.tauxFraisDivers = rest.tauxFraisDivers;
    if (rest.aleas !== undefined) data.tauxAleas = rest.aleas;
    if (rest.tauxAleas !== undefined) data.tauxAleas = rest.tauxAleas;

    // Vérifier que l'affaire existe
    const affaire = await db.affaire.findFirst({
      where: { id, userId: await getSessionUserId() }
    });
    if (!affaire) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find or create parc for this affaire (use ?parc= query param or default to 1)
    const parcNum = parseInt(req.nextUrl.searchParams.get('parc') || '1');
    let parc = await db.parc.findFirst({
      where: { affaireId: id, numero: parcNum }
    });
    if (!parc) {
      parc = await db.parc.create({
        data: { affaireId: id, numero: parcNum }
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
