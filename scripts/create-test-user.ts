/**
 * Crée (ou réinitialise) un compte de test, sans toucher aux autres comptes.
 *
 * Usage :
 *   npx tsx scripts/create-test-user.ts
 *   npx tsx scripts/create-test-user.ts --email moi@test.local --password "MonMdp1!" --role ADMIN
 *
 * Nécessite DATABASE_URL (fichier .env ou variable d'environnement).
 * Idempotent : si l'e-mail existe déjà, seul son mot de passe est réinitialisé.
 * Ne modifie JAMAIS un autre compte (admin client inclus).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charge .env manuellement (tsx ne le fait pas, et dotenv n'est pas une dépendance)
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // pas de .env : DATABASE_URL doit venir de l'environnement
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

async function main() {
  const email = arg('email', 'test@biomasse.local');
  const password = arg('password', 'TestBiomasse2026!');
  const role = arg('role', 'ADMIN').toUpperCase();

  if (role !== 'ADMIN' && role !== 'USER') {
    throw new Error(`Rôle invalide : ${role} (attendu ADMIN ou USER)`);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role },
    create: {
      email,
      password: hashed,
      nom: 'Test',
      prenom: 'Compte',
      entreprise: 'Tests internes',
      role,
    },
  });

  console.log('─'.repeat(50));
  console.log('Compte de test prêt :');
  console.log(`  E-mail       : ${user.email}`);
  console.log(`  Mot de passe : ${password}`);
  console.log(`  Rôle         : ${user.role}`);
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
