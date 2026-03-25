import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

let _cachedDefaultUserId: string | null = null;

export async function getDefaultUserId(): Promise<string> {
  if (_cachedDefaultUserId) return _cachedDefaultUserId;
  const user = await db.user.findFirst({
    where: { email: 'user@unique.local' },
    select: { id: true },
  });
  if (!user) throw new Error('Default user not found — run npx prisma db seed');
  _cachedDefaultUserId = user.id;
  return _cachedDefaultUserId!;
}

/**
 * Returns the authenticated user's ID from the session.
 * Falls back to the default user if no session is found (e.g. during seed/scripts).
 */
export async function getSessionUserId(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      return (session.user as any).id;
    }
  } catch {
    // getServerSession may fail outside of request context (e.g. scripts)
  }
  return getDefaultUserId();
}

/**
 * Returns the authenticated user's role from the session.
 */
export async function getSessionRole(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).role) {
      return (session.user as any).role;
    }
  } catch {
    // getServerSession may fail outside of request context
  }
  return 'USER';
}

/**
 * Checks if the current session user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getSessionRole();
  return role === 'ADMIN';
}
