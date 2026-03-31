import { db, getSessionUserId } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET — list teams the current user belongs to
export async function GET(_req: NextRequest) {
  try {
    const userId = await getSessionUserId();

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        equipes: {
          include: {
            membres: { select: { id: true, nom: true, prenom: true, email: true } },
            _count: { select: { affaires: true } },
          },
        },
      },
    });

    return NextResponse.json(user?.equipes || []);
  } catch (error) {
    console.error('[equipes/GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — create a new team (current user is automatically added)
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    const data = await req.json();

    if (!data.nom || typeof data.nom !== 'string' || data.nom.trim().length === 0) {
      return NextResponse.json({ error: 'Nom de l\'équipe requis' }, { status: 400 });
    }

    const equipe = await db.equipe.create({
      data: {
        nom: data.nom.trim(),
        membres: { connect: { id: userId } },
      },
      include: {
        membres: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });

    return NextResponse.json(equipe, { status: 201 });
  } catch (error) {
    console.error('[equipes/POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — add or remove a member by email
export async function PUT(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    const data = await req.json();

    if (!data.equipeId || !data.email || !data.action) {
      return NextResponse.json(
        { error: 'equipeId, email et action (add|remove) requis' },
        { status: 400 },
      );
    }

    if (data.action !== 'add' && data.action !== 'remove') {
      return NextResponse.json({ error: 'action doit être "add" ou "remove"' }, { status: 400 });
    }

    // Verify the current user is a member of this team
    const equipe = await db.equipe.findFirst({
      where: { id: data.equipeId, membres: { some: { id: userId } } },
    });
    if (!equipe) {
      return NextResponse.json({ error: 'Équipe non trouvée ou accès refusé' }, { status: 403 });
    }

    // Find target user by email
    const targetUser = await db.user.findUnique({ where: { email: data.email } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé avec cet email' }, { status: 404 });
    }

    const updated = await db.equipe.update({
      where: { id: data.equipeId },
      data: {
        membres: data.action === 'add'
          ? { connect: { id: targetUser.id } }
          : { disconnect: { id: targetUser.id } },
      },
      include: {
        membres: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[equipes/PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
