# Faisabilité Biomasse - Application Web

Application web complète pour les études de faisabilité technico-économique des projets de chauffage biomasse, remplaçant un fichier Excel (.xlsm) traditionnel.

## Caractéristiques principales

- **Gestion multi-projet** : Créer, modifier, dupliquer et supprimer des affaires (clients)
- **Calculs thermiques complexes** : Consommations énergétiques, déperditions, rendements
- **Analyse biomasse** : Dimensionnement chaudière, stockage, cendres
- **Analyses économiques** : Chiffrage, subventions, financement, temps de retour
- **Rapports** : Bilan actualisé 20 ans, analyses CO2/SO2, monotone de charge, export PDF
- **Base de données partagée** : Tables de référence pour énergies, coûts, conditions météo

## Stack technique

- **Frontend** : Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : NextAuth.js 5
- **Graphiques** : Recharts
- **PDF** : jsPDF + html2canvas

## Installation

### 1. Cloner le projet et installer les dépendances

```bash
npm install
```

### 2. Configurer la base de données

Créer un fichier `.env.local` avec votre connexion PostgreSQL :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/biomasse_db"
NEXTAUTH_SECRET="votre-clé-secrète"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialiser Prisma et la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# Pré-remplir les données de référence
npm run prisma:seed
```

### 4. Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera disponible à `http://localhost:3000`.

## Structure du projet

```
src/
├── app/                      # Pages Next.js (App Router)
│   ├── (auth)/              # Pages d'authentification
│   ├── dashboard/           # Tableau de bord
│   ├── affaires/           # Gestion des affaires
│   └── api/                # Routes API
├── components/             # Composants React
├── lib/
│   ├── calculs/            # Logique métier
│   │   ├── batiment.ts     # Calculs par bâtiment
│   │   ├── parc.ts         # Calculs par parc
│   │   ├── chiffrage.ts    # Calculs de coûts
│   │   └── bilan-actualise.ts
│   ├── db.ts               # Client Prisma
│   └── utils.ts            # Utilitaires
├── types/                  # Types TypeScript
└── prisma/                # Schéma et seeds

```

## Modèle de données

### Entités principales

- **User** : Utilisateurs de l'application
- **Affaire** : Projets/clients
- **Batiment** : Bâtiments d'une affaire
- **Parc** : Réseaux de chaleur (regroupements de bâtiments)
- **ChiffragReference** : Coûts solution de référence
- **ChiffrageBiomasse** : Coûts solution biomasse

### Tables de référence

- **Energie** : Tarifs énergétiques
- **CaracteristiqueBiomasse** : Propriétés des combustibles
- **FacteurEmission** : Facteurs CO2/SO2
- **BddCout** : Base de données des coûts unitaires
- **MeteoMoyenne** : DJU par département
- **MeteoMonotone** : Températures horaires par ville
- **PertesReseau** : Pertes réseau par section

## Fonctionnalités implémentées (Phase 1)

- [x] Structure projet Next.js
- [x] Schéma Prisma complet
- [x] Modules de calcul (bâtiment, parc, chiffrage, bilan)
- [ ] Authentification NextAuth
- [ ] Dashboard et liste des affaires
- [ ] Création/modification d'affaires
- [ ] Gestion des bâtiments
- [ ] Gestion des parcs et biomasse
- [ ] Chiffrage référence et biomasse
- [ ] Résultats et graphiques
- [ ] Export PDF
- [ ] UI responsive

## Variables d'environnement

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/biomasse_db"

# NextAuth
NEXTAUTH_SECRET="clé-secrète-pour-tokens"
NEXTAUTH_URL="http://localhost:3000"

# API (optionnel)
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Development

### Commandes utiles

```bash
# Dev server
npm run dev

# Build production
npm run build

# Start production
npm run start

# Linting
npm run lint

# Prisma operations
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Testing des calculs

Les formules de calcul ont été extraites du fichier Excel original et testées avec les valeurs de référence :

- Bâtiment "essai ajout bât" : 100 m², fuel → ~70189 kWh/an
- Bâtiment 2 : 200 m², électricité → ~58868 kWh/an

## Notes importantes

1. **Tous les calculs sont exécutés côté client** (hooks React) pour une réactivité maximale
2. **Économies à 20 ans** : Cœur de la démonstration économique
3. **Monotone de charge** : Utilise les données horaires de température d'une ville de référence
4. **DPE/Étiquette** : Basée sur la consommation kWhep/m²/an
5. **Taux TVA** : 20% appliqué à tous les investissements

## Roadmap

- Phase 1 : Configuration de base (✓ En cours)
- Phase 2 : Pages d'authentification et dashboard
- Phase 3 : Gestion des affaires et bâtiments
- Phase 4 : Chiffrage et analyses
- Phase 5 : Résultats, graphiques et PDF
- Phase 6 : Optimisations et tests

## Contributing

Ce projet est fourni à titre de démarrage pour une application de faisabilité biomasse. Tous les modules de calcul sont modulables et testables indépendamment.

## License

À définir

---

**Auteur** : Application développée dans le cadre d'une étude de faisabilité énergétique.

**Dernière mise à jour** : Mars 2026
