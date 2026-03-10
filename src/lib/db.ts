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

let _cachedUserId: string | null = null;

export async function getDefaultUserId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId;
  const user = await db.user.findFirst({
    where: { email: 'user@unique.local' },
    select: { id: true },
  });
  if (!user) throw new Error('Default user not found — run npx prisma db seed');
  _cachedUserId = user.id;
  return _cachedUserId;
}

/**
 * Always returns the shared default user ID.
 * All users share the same projects (single shared account).
 */
export async function getSessionUserId(): Promise<string> {
  return getDefaultUserId();
}
