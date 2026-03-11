import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Normalize batiment data from form to match schema (whitelist valid fields only)
function normalizeBatiment(b: any) {
  return {
    numero: b.numero,
    designation: b.designation,
    typeBatiment: b.typeBatiment || 'AUTRES',
    surfaceChauffee: parseFloat(b.surfaceChauffee) || 0,
    volumeChauffe: parseFloat(b.volumeChauffe) || 0,
    parc: b.parc || 1,
    deperditions: parseFloat(b.deperditions_kW ?? b.deperditions) || 0,
    rendementProduction: parseFloat(b.rendementProduction) || 0,
    rendementDistribution: parseFloat(b.rendementDistribution) || 0,
    rendementEmission: parseFloat(b.rendementEmission) || 0,
    rendementRegulation: parseFloat(b.rendementRegulation) || 0,
    coefIntermittence: parseFloat(b.coefIntermittence) || 1,
    consommationsCalculees: b.consommationsCalculees != null ? parseFloat(b.consommationsCalculees) : null,
    consommationsReelles: b.consommationsReelles != null ? parseFloat(b.consommationsReelles) : null,
    typeEnergie: b.typeEnergie || 'FUEL',
    tarification: parseFloat(b.tarification) || 0,
    abonnement: parseFloat(b.abonnement) || 0,
    refDeperditions: b.refDeperditions != null ? parseFloat(b.refDeperditions) : null,
    refTypeEnergie: b.refTypeEnergie || null,
    refRendementProduction: b.refRendementProduction != null ? parseFloat(b.refRendementProduction) : null,
    refRendementDistribution: b.refRendementDistribution != null ? parseFloat(b.refRendementDistribution) : null,
    refRendementEmission: b.refRendementEmission != null ? parseFloat(b.refRendementEmission) : null,
    refRendementRegulation: b.refRendementRegulation != null ? parseFloat(b.refRendementRegulation) : null,
    refTarification: b.refTarification != null ? parseFloat(b.refTarification) : null,
    refAbonnement: b.refAbonnement != null ? parseFloat(b.refAbonnement) : null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const batiments = await db.batiment.findMany({
      where: { affaireId: params.id }
    });

    return NextResponse.json(batiments);
  } catch (error: any) {
    console.error('[GET /api/affaires/[id]/batiments]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();

    // Support { batiments: [...] } wrapper format
    const items = Array.isArray(data) ? data : (data.batiments && Array.isArray(data.batiments)) ? data.batiments : null;

    // Si c'est une mise à jour en masse
    if (items) {
      // Validation
      for (const b of items) {
        const errors: string[] = [];
        if (!b.designation || b.designation.trim() === '') errors.push('Désignation manquante');
        if (b.surfaceChauffee != null && parseFloat(b.surfaceChauffee) < 0) errors.push('Surface chauffée ne peut pas être négative');
        if (b.deperditions != null && parseFloat(b.deperditions) < 0) errors.push('Déperditions ne peuvent pas être négatives');
        if (b.rendementProduction != null && (parseFloat(b.rendementProduction) < 0 || parseFloat(b.rendementProduction) > 100)) errors.push('Rendement production doit être entre 0 et 100');
        if (b.rendementDistribution != null && (parseFloat(b.rendementDistribution) < 0 || parseFloat(b.rendementDistribution) > 100)) errors.push('Rendement distribution doit être entre 0 et 100');
        if (b.rendementEmission != null && (parseFloat(b.rendementEmission) < 0 || parseFloat(b.rendementEmission) > 100)) errors.push('Rendement émission doit être entre 0 et 100');
        if (b.rendementRegulation != null && (parseFloat(b.rendementRegulation) < 0 || parseFloat(b.rendementRegulation) > 100)) errors.push('Rendement régulation doit être entre 0 et 100');
        if (errors.length > 0) {
          return NextResponse.json({ error: `Bâtiment "${b.designation || b.numero || '?'}" : ${errors.join(', ')}` }, { status: 400 });
        }
      }
      const results = [];
      for (const batiment of items) {
        if (!batiment.id || batiment.id.startsWith('new-')) {
          // Nouveau bâtiment (no id or temp id)
          const normalized = normalizeBatiment(batiment);
          const created = await db.batiment.create({
            data: {
              affaireId: params.id,
              ...normalized,
            }
          });
          results.push(created);
        } else {
          // Mise à jour
          const normalized = normalizeBatiment(batiment);
          const updated = await db.batiment.update({
            where: { id: batiment.id },
            data: normalized
          });
          results.push(updated);
        }
      }
      return NextResponse.json(results);
    }

    // Créer un seul bâtiment
    const normalized = normalizeBatiment(data);
    const batiment = await db.batiment.create({
      data: {
        affaireId: params.id,
        ...normalized
      }
    });

    return NextResponse.json(batiment);
  } catch (error: any) {
    console.error('[POST /api/affaires/[id]/batiments]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required

    const data = await req.json();
    const normalized = normalizeBatiment(data);

    const batiment = await db.batiment.updateMany({
      where: { affaireId: params.id },
      data: normalized
    });

    return NextResponse.json(batiment);
  } catch (error: any) {
    console.error('[PUT /api/affaires/[id]/batiments]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, _params: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required

    const { batimentId } = await req.json();  // Use _params if needed

    await db.batiment.delete({
      where: { id: batimentId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/affaires/[id]/batiments]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
