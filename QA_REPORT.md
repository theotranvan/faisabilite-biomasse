# RAPPORT QA — Faisabilité Biomasse

**Date** : 31 mars 2026  
**Auditeur** : QA Automatisé  
**Stack** : Next.js 16 (App Router) · Prisma/SQLite · NextAuth 4 · TypeScript

---

## 1. INVENTAIRE DES ROUTES

### Pages (11 routes)

| Route | Auth | Admin | Status |
|-------|------|-------|--------|
| `/` | Public | Non | ✅ OK |
| `/auth/login` | Public | Non | ✅ OK |
| `/auth/register` | Public | Non | ✅ OK |
| `/dashboard` | ✅ Middleware | Non | ✅ OK |
| `/affaires` | ✅ Middleware | Non | ✅ OK |
| `/affaires/new` | ✅ Middleware | Non | ⚠️ Wizard incomplet |
| `/affaires/[id]` | ✅ Middleware | Non | ⚠️ Voir bugs |
| `/affaires/[id]/resultats` | ✅ Middleware | Non | ⚠️ Doublon avec composant |
| `/couts` | ✅ Middleware + Admin | Oui | ✅ OK |
| `/admin/costs` | ✅ Middleware + Admin | Oui | ✅ OK |
| `/admin/meteo` | ✅ Middleware + Admin | Oui | ✅ OK |

### API Routes (30+ endpoints)

| Endpoint | Méthodes | Auth dans handler | Status |
|----------|----------|-------------------|--------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth | ✅ OK |
| `/api/auth/login` | POST | ❌ Aucune | 🔴 Route en double, inutile |
| `/api/auth/register` | POST | ❌ Public (normal) | ✅ OK |
| `/api/affaires` | GET, POST | ✅ getSessionUserId | ✅ OK |
| `/api/affaires/[id]` | GET, PUT, DELETE | ❌ GET/PUT sans auth | 🔴 CRITIQUE |
| `/api/affaires/duplicate` | POST | Partiel | ⚠️ Pas de vérif propriétaire |
| `/api/affaires/share` | POST, DELETE | ❌ Aucune | 🔴 CRITIQUE (stub) |
| `/api/affaires/[id]/batiments` | GET, POST, PUT, DEL | ❌ Aucune | 🔴 CRITIQUE |
| `/api/affaires/[id]/parcs` | GET, POST, PUT, DEL | ❌ Aucune | 🔴 CRITIQUE |
| `/api/affaires/[id]/chiffrage-reference` | GET, POST | ❌ GET sans auth | ⚠️ Incohérent |
| `/api/affaires/[id]/chiffrage-biomasse` | GET, POST | ❌ GET sans auth | ⚠️ Incohérent |
| `/api/affaires/[id]/batiments/[bid]/isolation` | GET, POST | ❌ Aucune | 🔴 CRITIQUE |
| `/api/calculs/[id]` | GET | ❌ Aucune | 🔴 CRITIQUE |
| `/api/costs` | GET, POST, PUT, DEL | ✅ isAdmin (POST/PUT/DEL) | ✅ OK |
| `/api/equipes` | GET, POST, PUT | ✅ getSessionUserId | ✅ OK |
| `/api/meteo/[departement]` | GET | Session | ✅ OK |
| `/api/meteo/monotone/[ville]` | GET | Session | ✅ OK |
| `/api/admin/meteo/dju-import` | POST | ❌ Aucune | 🔴 CRITIQUE |
| `/api/admin/meteo/monotone-import` | POST | ❌ Aucune | 🔴 CRITIQUE |
| `/api/admin/meteo/villes` | GET | ❌ Aucune | ⚠️ Pas critique |

---

## 2. BUGS CONFIRMÉS

### 🔴 CRITIQUE — Sécurité

| # | Fichier | Bug | Impact |
|---|---------|-----|--------|
| C1 | `api/affaires/[id]/route.ts` | GET et PUT sans authentification (commentaire "Mono-client app") | N'importe qui peut lire/modifier toutes les affaires |
| C2 | `api/affaires/[id]/batiments/route.ts` | Aucune auth sur GET/POST/PUT/DELETE | Accès total aux bâtiments sans connexion |
| C3 | `api/affaires/[id]/parcs/route.ts` | Aucune auth sur GET/POST/PUT/DELETE | Accès total aux parcs sans connexion |
| C4 | `api/affaires/[id]/batiments/[bid]/isolation/route.ts` | Aucune auth | Accès total à l'isolation |
| C5 | `api/calculs/[id]/route.ts` | Aucune auth | Calculs accessibles sans connexion |
| C6 | `api/admin/meteo/dju-import/route.ts` | Aucune vérification admin | N'importe qui peut importer des données météo |
| C7 | `api/admin/meteo/monotone-import/route.ts` | Aucune vérification admin | N'importe qui peut écraser les monotones |
| C8 | `api/affaires/share/route.ts` | Aucune auth + stub (faux résultats) | Route inutile et non protégée |
| C9 | `api/auth/login/route.ts` | Route dupliquée qui retourne les données user sans créer de session | Contourne le flux NextAuth, expose les rôles |

### 🔴 CRITIQUE — Perte de données

| # | Fichier | Bug | Impact |
|---|---------|-----|--------|
| D1 | `api/affaires/[id]/batiments/route.ts` PUT | `updateMany()` applique les mêmes valeurs à TOUS les bâtiments | Écrase tous les bâtiments avec les données d'un seul |
| D2 | `api/affaires/[id]/parcs/route.ts` PUT | `updateMany()` applique les mêmes valeurs à TOUS les parcs | Écrase tous les parcs avec les données d'un seul |
| D3 | `api/admin/meteo/monotone-import/route.ts` | `deleteMany` + `createMany` sans transaction | Si createMany échoue, les données sont perdues |

### ⚠️ HAUTE — Logique

| # | Fichier | Bug | Impact |
|---|---------|-----|--------|
| L1 | `api/calculs/[id]/route.ts` | `JSON.parse()` sans try/catch sur lignesChaufferie | Crash si données corrompues |
| L2 | `api/affaires/duplicate/route.ts` | Pas de vérification d'accès à l'affaire source | Un user peut dupliquer l'affaire d'un autre |
| L3 | `getSessionUserId()` dans db.ts | Fallback vers `getDefaultUserId()` quand pas de session | En production, un appel sans session utilise le compte par défaut au lieu de rejeter |

### ⚠️ MOYENNE — UX/Validation

| # | Composant | Bug | Impact |
|---|-----------|-----|--------|
| U1 | Pages (home, dashboard, affaires) | Erreur API silencieuse → affiche "Aucune étude" au lieu d'un message d'erreur | Utilisateur confond "vide" et "cassé" |
| U2 | `affaires/new/page.tsx` | Pas de bouton "Retour" dans le wizard multi-étapes | Données perdues si l'utilisateur veut revenir |
| U3 | Login/Register pages | Pas de redirect si déjà connecté | UX confuse, un user connecté voit le login |
| U4 | BatimentTable | Pas de validation des valeurs négatives | Surface -500 acceptée |
| U5 | ParcConfig | Pas de validation sur puissance/longueur (accepte négatifs) | Calculs aberrants |
| U6 | `affaires/[id]/page.tsx` | Pas d'avertissement "modifications non sauvegardées" | Données perdues sans warning |

---

## 3. MATRICE DE SÉCURITÉ

```
                    Middleware     Handler Auth    Owner Check
                    ──────────    ────────────    ───────────
/api/affaires       ✅ (via API)  ✅              ✅ (team/user)
/api/affaires/[id]  ✅            ❌ GET/PUT      ❌
/api/.../batiments  ✅            ❌              ❌
/api/.../parcs      ✅            ❌              ❌
/api/.../isolation  ✅            ❌              ❌
/api/calculs/[id]   ✅            ❌              ❌
/api/costs          ✅            ✅ (POST+)      N/A
/api/equipes        ✅            ✅              ✅
/api/admin/meteo/*  ✅            ❌              N/A
```

**Note importante** : Le middleware protège les routes `/api/*` (renvoie 401 si pas de token), mais certains handlers permettent le **fallback** vers le user par défaut via `getSessionUserId()` → `getDefaultUserId()`. Cela signifie que même si le middleware bloque, le code handler ne vérifie pas la propriété de la ressource.

---

## 4. FICHIERS DE TEST GÉNÉRÉS

### `tests/api.test.ts` — Tests API complets
- **14 sections**, ~80 assertions
- Couvre : routes publiques, auth, middleware, CRUD affaires, bâtiments, parcs, chiffrage, calculs, coûts, équipes, météo, isolation, edge cases, sécurité
- **Usage** : `npx tsx tests/api.test.ts` (serveur doit tourner)

### `tests/e2e.spec.ts` — Tests End-to-End Playwright
- **10 sections**, ~35 tests
- Couvre : login/register, pages protégées, dashboard, création d'affaire, navigation par tabs, parcours complet utilisateur, fonctions admin, navigation, erreurs, validations de formulaires
- **Setup** :
  ```bash
  npm install --save-dev @playwright/test
  npx playwright install chromium
  ```
- **Usage** : `npx playwright test tests/e2e.spec.ts --headed`

---

## 5. CORRECTIONS PRIORITAIRES RECOMMANDÉES

### Phase 1 — Immédiat (sécurité)

**5.1 Ajouter auth dans tous les handlers API manquants**

Pattern à appliquer dans chaque route :
```typescript
import { getSessionUserId, isAdmin } from '@/lib/db';

export async function GET(req, { params }) {
  const userId = await getSessionUserId();
  // + vérifier que l'affaire appartient à userId ou à son équipe
}
```

Routes à corriger :
- `api/affaires/[id]/route.ts` (GET, PUT)
- `api/affaires/[id]/batiments/route.ts` (tout)
- `api/affaires/[id]/parcs/route.ts` (tout)
- `api/affaires/[id]/batiments/[bid]/isolation/route.ts` (tout)
- `api/calculs/[id]/route.ts`
- `api/admin/meteo/dju-import/route.ts` (ajouter `isAdmin()`)
- `api/admin/meteo/monotone-import/route.ts` (ajouter `isAdmin()`)

**5.2 Supprimer `api/auth/login/route.ts`**

Route inutile qui duplique NextAuth sans créer de session. Tout passe par `/api/auth/callback/credentials`.

**5.3 Supprimer ou désactiver `api/affaires/share/route.ts`**

Stub non-fonctionnel sans auth.

**5.4 Corriger `getSessionUserId()` pour ne pas fallback en production**

```typescript
export async function getSessionUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Non authentifié');
  }
  return getDefaultUserId(); // Dev only
}
```

### Phase 2 — Urgent (intégrité données)

**5.5 Corriger `updateMany` → `update` dans batiments et parcs**

```typescript
// batiments/route.ts PUT — AVANT (bug)
const batiment = await db.batiment.updateMany({
  where: { affaireId: id },
  data: normalized
});

// APRÈS (corrigé)
const batiment = await db.batiment.update({
  where: { id: data.id },
  data: normalized
});
```

Idem pour `parcs/route.ts`.

**5.6 Wrapper deleteMany+createMany dans une transaction**

```typescript
// monotone-import — APRÈS
await db.$transaction([
  db.meteoMonotone.deleteMany({ where: { ville } }),
  db.meteoMonotone.createMany({ data: records }),
]);
```

**5.7 Ajouter try/catch autour des JSON.parse**

```typescript
let lignes = [];
try { lignes = JSON.parse(chiffrageRef.lignesChaufferie || '[]'); } catch { lignes = []; }
```

### Phase 3 — Important (UX)

**5.8 Afficher les erreurs API au lieu de "vide"**

```typescript
// Pattern pour toutes les pages avec fetch
const [error, setError] = useState('');

const res = await fetch('/api/affaires');
if (!res.ok) {
  setError('Erreur de chargement des données');
  return;
}
```

**5.9 Ajouter validation côté client**

- Surface, puissance, consommation ≥ 0
- Rendement entre 0 et 100
- Prix unitaire > 0

**5.10 Redirect si déjà connecté (login/register)**

```typescript
const { data: session } = useSession();
const router = useRouter();
useEffect(() => {
  if (session) router.push('/dashboard');
}, [session]);
```

### Phase 4 — Bonus (robustesse)

- Ajouter rate limiting sur `/api/auth/register` et `/api/auth/login`
- Ajouter CAPTCHA sur l'inscription
- Réduire la durée de session de 30j → 8h (OWASP)
- Ajouter des logs d'audit sur les opérations sensibles
- Valider les tailles de fichier CSV avant import (max 5 MB)
- Ajouter un avertissement "modifications non sauvegardées" dans le détail d'affaire

---

## 6. RÉSUMÉ

| Catégorie | Nombre | Sévérité |
|-----------|--------|----------|
| Auth manquante (API handlers) | 9 endpoints | 🔴 CRITIQUE |
| Bugs de perte de données | 3 | 🔴 CRITIQUE |
| Logique/validation | 3 | ⚠️ HAUTE |
| UX/erreurs silencieuses | 6 | ⚠️ MOYENNE |
| **Total** | **21 problèmes** | |

**L'application est fonctionnelle pour un usage mono-utilisateur en local**, mais nécessite les corrections de Phase 1 et 2 avant tout déploiement public.
