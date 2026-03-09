import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mono-client app - no auth required
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
    // Mono-client app - no auth required
    const data = await req.json();

    // Si c'est une mise à jour en masse
    if (Array.isArray(data)) {
      const results = [];
      for (const batiment of data) {
        if (batiment.id && batiment.id.startsWith('new-')) {
          // Nouveau bâtiment
          const created = await db.batiment.create({
            data: {
              affaireId: params.id,
              ...batiment,
              id: undefined
            }
          });
          results.push(created);
        } else if (batiment.id) {
          // Mise à jour
          const updated = await db.batiment.update({
            where: { id: batiment.id },
            data: batiment
          });
          results.push(updated);
        }
      }
      return NextResponse.json(results);
    }

    // Créer un seul bâtiment
    const batiment = await db.batiment.create({
      data: {
        affaireId: params.id,
        ...data
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

    const batiment = await db.batiment.updateMany({
      where: { affaireId: params.id },
      data: data
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
