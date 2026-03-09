# 🚀 Guide de Déploiement et Utilisation

## Déploiement local

### 1. Installation
```bash
cd FaisabilitéBiomasse
npm install
npx prisma migrate dev
npm run dev
```

L'app sera sur `http://localhost:3000`

### 2. Accounts de test

**Admin:**
- Email: admin@example.com
- Password: admin123

**User:**
- Email: user@example.com
- Password: user123
 
Ou créez votre propre compte via `/auth/register`

## 🎯 Workflow type d'utilisation

### 1. Créer un projet
- Dashboard → "+ Nouveau projet"
- Remplir infos: client, adresse, département
- Valider la création

### 2. Analyser les bâtiments (Tab Bâtiments)
- Ajouter chaque bâtiment
- Éditer: surface, volume, déperditions, type d'énergie
- Supporter scénarios initial & référence

### 3. Configurer le réseau (Tab Réseau)
- Type biomasse (Plaquette, Granulés, etc.)
- Puissance chaudière
- Longueur réseau, section tuyauterie
- % couverture biomasse

### 4. Chiffrer l'investissement (Tab Coûts)
- **Scénario référence**: Coûts solution actuelle
- **Scénario biomasse**: 
  - Installation (chaudières, réseau, local)
  - Maintenance annuelle
  - Aides (crédit d'impôt, éco-chèque)

### 5. Analyser les résultats (Tab Résultats)
- Voir projections 20 ans
- Délai retour investissement
- Impact environnemental
- CO₂ évitées

### 6. Valider complétude (Tab Validation)
- Voir barre de progression
- Corriger erreurs détectées
- Vérifier avertissements

### 7. Exporter & Partager (Tab Export/Partage)
- Télécharger PDF rapport
- Dupliquer le projet
- Partager avec collègues (rôles: Lecteur/Éditeur/Admin)

### 8. Suivi historique (Tab Historique)
- Voir toutes les modifications
- Traçabilité complète

## 💻 Gestion de la Base de Données des Coûts

Accédez via: **Dashboard → ⚙️ Gestion coûts**

Ici vous pouvez:
- ➕ Ajouter des coûts de référence
- ✏️ Modifier les existants
- 🗑️ Supprimer les obsolètes

Ces coûts sont utilisés pour calibrer les analyses.

## 📊 Fonctionnalités clés

| Feature | Accès | Avantage |
|---------|-------|---------|
| **Multi-scénarios** | Tabs État initial/Référence | Comparer situations |
| **Graphiques temps réel** | Tab Résultats | Visualiser facilement |
| **Export PDF** | Tab Export | Rapports professionnels |
| **Duplication** | Tab Export -> Actions | Réutiliser projets similaires |
| **Partage** | Tab Partage | Collaboration d'équipe |
| **Historique** | Tab Historique | Traçabilité complète |
| **Validations** | Tab Validation | Éviter erreurs |

## 🔒 Sécurité et Permissions

- **Lectures**: Projets visibles uniquement par propriétaire + utilisateurs autorisés
- **Édition**: Rôle "Éditeur" ou "Admin" requis
- **Admin**: Accès gestion coûts
- **Audit**: Historique tous les changements

## 📈 Calculs effectués

### Moteur de calcul automatique:
- **Déperditions thermiques** bâtiment (W/m²K)
- **Puissance installée** chaufferie (kW)
- **Couverture énergétique** réseau (%)
- **Économies annuelles** (€/an)
- **Projection 20 ans** ROI, payback
- **Émissions CO₂** évitées

### Données utilisées:
- Coefficients isolation par type bâtiment
- Consommations climat par département (DJU)
- Prix énergies selon région
- Rendements chaudières biomasse
- Tarifs installation/maintenance

## 🔧 Configuration personnalisée

### Variables d'environnement (.env.local):
```env
NEXTAUTH_SECRET=<secret-jwt>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./prisma/dev.db
```

### Déploiement Vercel:
```bash
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL  # PostgreSQL URI
vercel deploy
```

## 📞 Troubleshooting

| Problème | Solution |
|----------|----------|
| Erreur "Unauthorized" | Vérifiez NEXTAUTH_SECRET variable |
| Données pas sauvegardées | Vérifiez DATABASE_URL & Prisma migration |
| Calculs incorrects | Vérifiez données saisies (surface, volumes) |
| PDF vide | Remplissez tous les tabs avant export |

## 📚 Documentation technique

- **Architecture**: Next.js 14, Prisma, SQLite/PostgreSQL
- **API**: RESTful routes dans `/api/affaires/`
- **Calculs**: Fonctions pures dans `/lib/calculs/`
- **UI**: Tailwind CSS + Recharts
- **Auth**: NextAuth.js JWT sessions

---

**Version**: 1.0 - MVP complet  
**Status**: Production ready
