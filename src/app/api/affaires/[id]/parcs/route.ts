import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const parcs = await db.parc.findMany({
      where: { affaireId: params.id }
    });

    return NextResponse.json(parcs);
  } catch (error: any) {
    console.error('[GET /api/affaires/[id]/parcs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const data = await req.json();

    // Vérifier que l'affaire existe
    const affaire = await db.affaire.findFirst({
      where: { id: params.id }
    });
    if (!affaire) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Si c'est une mise à jour en masse
    if (Array.isArray(data)) {
      const results = [];
      for (const parc of data) {
        // Strip non-updatable and relation fields
        const { id: parcId, affaireId: _aid, createdAt: _ca, updatedAt: _ua, chiffrageRef: _cr, chiffrageBio: _cb, affaire: _aff, ...parcData } = parc;
        if (!parcId || parcId.startsWith('new-') || parcId === '1') {
          // New parc - upsert by affaireId + numero
          const existing = await db.parc.findFirst({
            where: { affaireId: params.id, numero: parcData.numero || 1 }
          });
          if (existing) {
            const updated = await db.parc.update({
              where: { id: existing.id },
              data: parcData
            });
            results.push(updated);
          } else {
            const created = await db.parc.create({
              data: { affaireId: params.id, ...parcData, numero: parcData.numero || 1 }
            });
            results.push(created);
          }
        } else {
          const updated = await db.parc.update({
            where: { id: parcId },
            data: parcData
          });
          results.push(updated);
        }
      }
      return NextResponse.json(results);
    }

    // Single parc - strip non-schema fields and upsert
    const { id: _id, affaireId: _aid, createdAt: _ca, updatedAt: _ua, chiffrageRef: _cr, chiffrageBio: _cb, affaire: _aff, ...parcData } = data;
    const numero = parcData.numero || 1;

    const existing = await db.parc.findFirst({
      where: { affaireId: params.id, numero }
    });

    if (existing) {
      const parc = await db.parc.update({
        where: { id: existing.id },
        data: parcData
      });
      return NextResponse.json(parc);
    }

    const parc = await db.parc.create({
      data: {
        affaireId: params.id,
        ...parcData,
        numero
      }
    });

    return NextResponse.json(parc);
  } catch (error: any) {
    console.error('[POST /api/affaires/[id]/parcs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required

    const data = await req.json();
    const { id: _id, affaireId: _aid, createdAt: _ca, updatedAt: _ua, chiffrageRef: _cr, chiffrageBio: _cb, affaire: _aff, ...parcData } = data;

    const result = await db.parc.updateMany({
      where: { affaireId: params.id },
      data: parcData
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PUT /api/affaires/[id]/parcs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, _params: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required

    const { parcId } = await req.json();

    await db.parc.delete({
      where: { id: parcId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/affaires/[id]/parcs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
