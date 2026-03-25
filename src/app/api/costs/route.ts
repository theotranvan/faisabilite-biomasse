import { NextRequest, NextResponse } from 'next/server';
import { db, isAdmin } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const allCosts = await db.bddCout.findMany();
    return NextResponse.json(allCosts);
  } catch (error: any) {
    console.error('[GET /api/costs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }
    const data = await req.json();

    // Check if cost already exists to avoid duplicates
    const existing = await db.bddCout.findFirst({
      where: {
        categorie: data.categorie,
        designation: data.designation,
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Cost already exists' }, { status: 409 });
    }

    const cost = await db.bddCout.create({
      data: {
        categorie: data.categorie,
        designation: data.designation,
        prixUnitaire: parseFloat(data.prixUnitaire),
        unite: data.unite || 'FORFAIT',
      }
    });

    return NextResponse.json(cost);
  } catch (error: any) {
    console.error('[POST /api/costs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }
    const { id, ...data } = await req.json();

    const updateData: any = { ...data };
    if (data.prixUnitaire) {
      updateData.prixUnitaire = parseFloat(data.prixUnitaire);
    }

    const cost = await db.bddCout.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(cost);
  } catch (error: any) {
    console.error('[PUT /api/costs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }
    const { id } = await req.json();

    await db.bddCout.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/costs]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
