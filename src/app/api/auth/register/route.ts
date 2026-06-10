import { db, isAdmin } from '@/lib/db';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Création de compte — accès sur invitation uniquement :
 * seul un ADMIN connecté peut créer des accès.
 * Exception bootstrap : si la base ne contient encore AUCUN utilisateur
 * (déploiement neuf sans seed), le premier compte créé devient ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const userCount = await db.user.count();
    const bootstrap = userCount === 0;

    if (!bootstrap && !(await isAdmin())) {
      return NextResponse.json(
        { error: 'Création de compte réservée à l\'administrateur (accès sur invitation)' },
        { status: 403 }
      );
    }

    const { email, password, nom, prenom, entreprise, role } = await req.json();

    // Validation
    if (!email || !password || !nom || !prenom) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Bootstrap → ADMIN ; sinon l'admin choisit le rôle (USER par défaut)
    const newRole = bootstrap ? 'ADMIN' : (role === 'ADMIN' ? 'ADMIN' : 'USER');

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        entreprise: entreprise || null,
        role: newRole,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[auth/register]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
