import { db, getSessionUserId, getSessionRole } from '@/lib/db';

/**
 * Périmètre d'accès de la session courante.
 * Modèle : chaque utilisateur voit ses propres affaires + celles de ses
 * équipes ; un ADMIN voit tout. Les comptes sont créés par l'admin
 * (inscription publique désactivée).
 */
export interface SessionScope {
  userId: string;
  role: string;
  isAdmin: boolean;
  equipeIds: string[];
}

export async function getSessionScope(): Promise<SessionScope> {
  const userId = await getSessionUserId();
  const role = await getSessionRole();
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { equipes: { select: { id: true } } },
  });
  return {
    userId,
    role,
    isAdmin: role === 'ADMIN',
    equipeIds: user?.equipes.map((e: { id: string }) => e.id) ?? [],
  };
}

/**
 * Clause Prisma `where` limitant les affaires au périmètre de la session.
 */
export function affaireWhereForScope(scope: SessionScope): Record<string, unknown> {
  if (scope.isAdmin) return {};
  const or: Record<string, unknown>[] = [{ userId: scope.userId }];
  if (scope.equipeIds.length > 0) {
    or.push({ equipeId: { in: scope.equipeIds } });
  }
  return { OR: or };
}

/**
 * Vrai si la session courante peut accéder à l'affaire (lecture/écriture).
 * Renvoie false aussi quand l'affaire n'existe pas — les routes répondent
 * 404 dans les deux cas pour ne pas révéler l'existence des affaires d'autrui.
 */
export async function canAccessAffaire(
  affaireId: string,
  scope?: SessionScope
): Promise<boolean> {
  const s = scope ?? (await getSessionScope());
  const affaire = await db.affaire.findFirst({
    where: { id: affaireId, ...affaireWhereForScope(s) },
    select: { id: true },
  });
  return !!affaire;
}

/**
 * Vrai si la session peut SUPPRIMER l'affaire : propriétaire ou admin
 * (les membres d'équipe peuvent lire/modifier mais pas supprimer).
 */
export async function canDeleteAffaire(
  affaireId: string,
  scope?: SessionScope
): Promise<boolean> {
  const s = scope ?? (await getSessionScope());
  if (s.isAdmin) return true;
  const affaire = await db.affaire.findFirst({
    where: { id: affaireId, userId: s.userId },
    select: { id: true },
  });
  return !!affaire;
}
