# Faisabilité Biomasse

Application web de faisabilité technico-économique pour projets de chauffage biomasse.

## Stack
- Next.js 16, TypeScript, Tailwind CSS
- Prisma ORM, SQLite (ou PostgreSQL)
- NextAuth.js (authentification par credentials)
- Recharts (graphiques), jsPDF (export PDF)

## Installation
```bash
git clone https://github.com/theotranvan/faisabilite-biomasse.git
cd faisabilite-biomasse
cp .env.example .env
npm install
npx prisma generate
npx prisma db seed
npm run dev
```

## Comptes par défaut (seed — à changer avant mise en production)
- Admin : admin@biomasse.local / biomasse2026
- User : user@unique.local / biomasse2026

## Accès sur invitation
L'inscription publique est désactivée : seul un administrateur connecté peut créer
des comptes (page « Créer un accès » : `/auth/register`). Chaque utilisateur ne voit
que ses propres affaires et celles de ses équipes ; un administrateur voit tout.

## Tests
```bash
npm test              # Tests de calcul + régression
```

## Déploiement PostgreSQL
1. Changer `provider = "sqlite"` en `provider = "postgresql"` dans `prisma/schema.prisma`
2. Mettre à jour `DATABASE_URL` dans `.env`
3. `npx prisma migrate deploy && npx prisma db seed`
