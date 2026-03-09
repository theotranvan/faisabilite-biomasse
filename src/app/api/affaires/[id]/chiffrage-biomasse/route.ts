import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const chiffrage = await db.chiffrageBiomasse.findFirst({
      where: { 
        parc: {
          affaireId: params.id
        }
      }
    });

    return NextResponse.json(chiffrage || {});
  } catch (error: any) {
    console.error('[GET /api/affaires/[id]/chiffrage-biomasse]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
    const data = await req.json();

    // Vérifier que l'affaire existe
    const affaire = await db.affaire.findFirst({
      where: { id: params.id, userId: 'cmmgnvghb0044qugjmoilecnq' }
    });
    if (!affaire) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find first parc for this affaire
    const parc = await db.parc.findFirst({
      where: { affaireId: params.id }
    });
    if (!parc) return NextResponse.json({ error: 'No parc found' }, { status: 404 });

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
