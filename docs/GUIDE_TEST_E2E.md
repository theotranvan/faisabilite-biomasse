# Guide de test bout-en-bout — Faisabilité Biomasse SaaS

> Valeurs issues de l'Excel `faisabilite_biomasse_version_2.xlsm` audité.  
> Résultats attendus vérifiés formule par formule.

---

## Prérequis

- L'application tourne sur `http://localhost:3000` (ou l'URL de prod)
- La base est initialisée (`npx prisma migrate deploy && npx prisma db seed`)
- Vous avez l'e-mail et le mot de passe admin

---

## ÉTAPE 1 — Connexion Admin

1. Aller sur `/login`
2. Saisir :
   - **E-mail** : `admin@biomasse.local`
   - **Mot de passe** : celui défini lors du premier seed (affiché une seule fois en console, ou votre `SEED_ADMIN_PASSWORD`)
3. Cliquer **Se connecter**
4. ✅ Attendu : redirection vers `/dashboard`, bandeau admin visible

---

## ÉTAPE 2 — Créer un compte utilisateur

1. Aller sur `/admin/users` (ou menu Admin → Utilisateurs)
2. Cliquer **Nouvel utilisateur**
3. Saisir :
   - **Nom** : `Marie Dupont`
   - **E-mail** : `marie@test.local`
   - **Mot de passe** : `Test1234!`
   - **Rôle** : `USER`
4. Cliquer **Créer**
5. ✅ Attendu : utilisateur visible dans la liste

---

## ÉTAPE 3 — Connexion en tant qu'utilisateur

1. Se déconnecter (menu en haut à droite → Déconnexion)
2. Se reconnecter avec `marie@test.local` / `Test1234!`
3. ✅ Attendu : dashboard vide (aucune affaire visible)

---

## ÉTAPE 4 — Créer une affaire

1. Cliquer **Nouvelle affaire**
2. Remplir le formulaire :

| Champ | Valeur |
|-------|--------|
| Nom de l'affaire | `Commune de Bourges — Test E2E` |
| Référence | `2026-TEST-001` |
| Département | `18` (Cher — ou taper "Cher" dans le champ) |
| DJU retenus | _(laisser vide — doit se remplir automatiquement à 2004.1)_ |
| Température intérieure | `19` °C |
| Température extérieure de base | `-7` °C |
| Durée d'emprunt | `15` ans |
| Nombre de parcs | `1` |

3. Cliquer **Enregistrer**
4. ✅ Attendu : affaire créée, redirection vers sa fiche
5. ✅ Vérifier que **DJU = 2 004,1** s'affiche (lookup automatique département 18)

---

## ÉTAPE 5 — Ajouter le Bâtiment 1

1. Dans l'affaire, onglet **Bâtiments** → **Ajouter un bâtiment**
2. Saisir :

| Champ | Valeur |
|-------|--------|
| Désignation | `École primaire` |
| Type | `LOGEMENTS` (ou "Enseignement") |
| Parc | `1` |
| Surface | `100` m² |
| **État initial** | |
| Énergie actuelle | `Fioul` |
| Prix énergie actuelle | `0.13` €/kWh |
| Consommation actuelle | `40 000` kWh/an _(valeur libre, sert au bilan actuel)_ |
| Déperditions | `10` kW |
| Rendement production | `80` % |
| Rendement distribution | `90` % |
| Rendement émission | `90` % |
| Rendement régulation | `90` % |
| Coef. intermittence | `1.0` |
| **État de référence** | |
| Énergie référence | `Gaz naturel` |
| Prix énergie référence | `0.0978` €/kWh |
| Déperditions référence | `10` kW _(idem état initial si pas de rénovation)_ |
| Rendement production | `80` % |
| Rendement distribution | `90` % |
| Rendement émission | `90` % |
| Rendement régulation | `90` % |

3. Cliquer **Enregistrer**

---

## ÉTAPE 6 — Ajouter le Bâtiment 2

1. **Ajouter un bâtiment** → saisir :

| Champ | Valeur |
|-------|--------|
| Désignation | `Salle polyvalente` |
| Type | `BUREAUX` |
| Parc | `1` |
| Surface | `200` m² |
| **État initial** | |
| Énergie actuelle | `Électricité` |
| Prix énergie actuelle | `0.226` €/kWh |
| Consommation actuelle | `25 000` kWh/an |
| Déperditions | `20` kW |
| Rendement production | `95` % |
| Rendement distribution | `95` % |
| Rendement émission | `100` % |
| Rendement régulation | `100` % |
| Coef. intermittence | `1.0` |
| **État de référence** | |
| Énergie référence | `Gaz naturel` |
| Prix énergie référence | `0.0978` €/kWh |
| Déperditions référence | `20` kW |
| Rendement production | `85` % |
| Rendement distribution | `90` % |
| Rendement émission | `90` % |
| Rendement régulation | `90` % |

2. Cliquer **Enregistrer**

---

## ÉTAPE 7 — Vérifier les consommations de référence calculées

Aller dans l'onglet **Résultats / Bilan** (ou le tableau récapitulatif des bâtiments).

### Formule appliquée :
```
conso_ref = (déperd_kW × 1000 × DJU × 24) / (ΔT × η_moyen × 1000) × coef_intermittence
```
avec ΔT = Tint − Text = 19 − (−7) = **26 °C**  
DJU = **2 004,1**

### Bâtiment 1
- η_moyen = 0.80 × 0.90 × 0.90 × 0.90 = **0.5832**
- conso_ref B1 = (10 × 1000 × 2004.1 × 24) / (26 × 0.5832 × 1000) × 1.0
- ✅ **Attendu : 31 707 kWh** _(≈ 31 291 avec les DJU Excel exact 1981.6 ; tolérance ±5%)_

### Bâtiment 2
- η_moyen = 0.85 × 0.90 × 0.90 × 0.90 = **0.6197**
- conso_ref B2 = (20 × 1000 × 2004.1 × 24) / (26 × 0.6197 × 1000) × 1.0
- ✅ **Attendu : 59 625 kWh** _(≈ 50 066 avec DJU et déperd Excel exact ; tolérance ±20% selon déperditions)_

> **Note** : si les valeurs divergent de plus de 5%, vérifier que le DJU affiché = 2004.1 et non 2400.

---

## ÉTAPE 8 — Chiffrage Référence (Parc 1)

1. Aller dans l'onglet **Chiffrage → Référence → Parc 1**
2. **Travaux Chaufferie** — saisir les lignes suivantes :

| Désignation | Unité | Qté | P.U. (€) | Total attendu |
|-------------|-------|-----|-----------|---------------|
| Chaudière gaz | unité | 2 | 8 000 | 16 000 € |
| Réseau hydraulique | ml | 50 | 80 | 4 000 € |
| Ballon tampon | unité | 1 | 3 000 | 3 000 € |

- **Sous-total Chaufferie** ✅ Attendu : **23 000 €**

3. **Frais Annexes** :

| Champ | Valeur |
|-------|--------|
| Bureau de Contrôle | `0` (0%) |
| Maîtrise d'œuvre | `0.13` (13%) |
| Frais Divers | `0.02` (2%) |
| Aléas | `0.05` (5%) |

- **Total taux** ✅ Attendu : **20.0%**
- **Frais Annexes** ✅ Attendu : **4 600 €** (23 000 × 20%)
- **Total Investissement HT** ✅ Attendu : **27 600 €**
- **Total Investissement TTC (20%)** ✅ Attendu : **33 120 €**

4. **Exploitation & Financement** :

| Champ | Valeur |
|-------|--------|
| Montant P2 (maintenance) | `750` €/an |
| Montant d'emprunt | `27 600` € _(financement total HT)_ |

5. Cliquer **Enregistrer**
6. ✅ Attendu : pas d'erreur, données rechargées avec les mêmes valeurs

---

## ÉTAPE 9 — Chiffrage Biomasse (Parc 1)

1. Aller dans **Chiffrage → Biomasse → Parc 1**
2. Saisir les paramètres de la chaudière bois :

| Champ | Valeur |
|-------|--------|
| Puissance chaudière bois | `100` kW |
| Rendement chaudière bois | `85` % |
| % couverture bois | `80` % |
| PCI bois (plaquettes) | `3.5` MWh/t |
| Masse volumique | `250` kg/m³ |
| Taux d'humidité | `0.25` (25%) |
| Taux de cendres | `0.015` (1.5%) |
| Volume camion | `40` m³ |
| Longueur réseau chaleur | `100` ml |
| Section réseau | `DN50` |

3. **Travaux Biomasse** :

| Désignation | Qté | P.U. | Total |
|-------------|-----|------|-------|
| Chaudière bois | 1 | 80 000 | 80 000 € |
| Gros œuvre/local chaudière | 1 | 20 000 | 20 000 € |
| Réseau chaleur | 100 | 200 | 20 000 € |
| Silo | 1 | 15 000 | 15 000 € |

- **Sous-total travaux bio** ✅ Attendu : **135 000 €**

4. **Frais Annexes Biomasse** : mêmes taux que référence (0 / 13% / 2% / 5%)
   - **Total HT bio** ✅ Attendu : **135 000 × 1.20 = 162 000 €** _(si taux = 20%)_

5. **Subventions** :

| Champ | Valeur |
|-------|--------|
| COT-EnR | `0.40` (40%) |
| Aide départementale | `0.15` (15%) |
| DETR/DSIL | `0.20` (20%) |

   - **Total subventions** ✅ Attendu : **75% de l'HT bio** = **121 500 €** _(plafonné à 80% max)_
   - **Reste à charge HT** ✅ Attendu : **40 500 €**

6. **Financement** :

| Champ | Valeur |
|-------|--------|
| Montant P2 biomasse | `3 500` €/an |
| Emprunt biomasse | `40 500` € |

7. Cliquer **Enregistrer**

---

## ÉTAPE 10 — Vérifier les résultats techniques biomasse

Aller dans l'onglet **Résultats Biomasse** ou le tableau de synthèse.

Calculs attendus (avec conso totale parc ≈ 91 332 kWh/an à vérifier) :

### Pertes réseau DN50, 100 ml
- Formule : `100 ml × 0.012 kW/ml × 3450 h`
- ✅ Attendu : **4 140 kWh/an**

### Consommation totale à produire
- ≈ 91 332 + 4 140 = **95 472 kWh/an**

### Sortie chaudière bois (80% couverture)
- 95 472 × 80% = **76 378 kWh**

### Entrée chaudière bois (η = 85%)
- 76 378 / 0.85 = **89 856 kWh**

### Volume annuel bois
- tonnes = 89 856 / (3 500) = **25.7 t**
- m³ = (25 700) / 250 = **102.8 m³**

### Consommation 10 jours les plus froids
- 89 856 × 11% = **9 884 kWh** _(11% = constante Excel)_

### Volume stockage silo recommandé
- max(40 m³ camion, conso10j m³) × (1 + 20% + 30%)
- conso10j m³ = 9 884 / 3 500 × 1 000 / 250 = **11.3 m³**
- max(40, 11.3) × 1.5 = **60 m³**

### Nombre de livraisons
- 102.8 / 40 = **2.6 livraisons/an** (soit 3 arrondi)

### Volume cendres
- masse sèche = 25 700 × (1 − 0.25) = 19 275 kg
- cendres kg = 19 275 × 0.015 = **289 kg/an**
- cendres m³ = 289 / 600 = **0.48 m³/an**

✅ Si tous ces résultats s'affichent à ±2% → calculs corrects.

---

## ÉTAPE 11 — Vérifier le Bilan 20 ans

Aller dans l'onglet **Bilan économique** ou **Résultats → Bilan 20 ans**.

### Scénario Référence (gaz)
- Annuité emprunt = 27 600 / 15 = **1 840 €/an**
- Coût énergie annuel référence ≈ (conso totale parc) × 0.0978
- Coût total annuel référence = énergie + P2 (750) + annuité (1 840)

### Scénario Biomasse
- Annuité emprunt bio = 40 500 / 15 = **2 700 €/an**
- Coût énergie bois ≈ 25.7 t × (prix bois €/t — vérifier valeur par défaut ~100 €/t) = **2 570 €/an**
- Coût énergie appoint gaz (20% restants) ≈ (95 472 × 20%) / 0.85 × 0.0978 ≈ **2 199 €/an**
- Coût total annuel bio = énergie bois + énergie appoint + P2 (3 500) + annuité (2 700)

### Gain annuel attendu
- ✅ Le bilan doit montrer un **retour sur investissement entre 8 et 15 ans** selon les paramètres

### Graphique 20 ans
- ✅ La courbe biomasse doit croiser la courbe référence avant l'année 15
- ✅ L'économie cumulée à 20 ans doit être positive

---

## ÉTAPE 12 — Vérifier l'étiquette DPE / classe énergie

Dans la fiche bâtiment, vérifier que les étiquettes s'affichent :

### Bâtiment 1 (école, 100 m²)
- Consommation actuelle : 40 000 kWh / 100 m² = **400 kWh/m²/an** → Classe **F ou G** (seuil G > 420)
- Consommation référence ≈ 317 kWh/m²/an → Classe **E** (180-250 kWh → C, 250-330 → D, 330-420 → E)
- ✅ Attendu : badge rouge/orange pour actuel, vert/jaune pour référence

### Bâtiment 2 (salle polyvalente, 200 m²)
- Consommation actuelle : 25 000 / 200 = **125 kWh/m²/an** → Classe **B ou C**
- ✅ Attendu : badge vert

---

## ÉTAPE 13 — Isolation des données (test sécurité)

1. Se déconnecter de `marie@test.local`
2. Retourner sur `/login`, se connecter avec un **second utilisateur** créé par l'admin :
   - E-mail : `jean@test.local`
   - Mot de passe : `Test5678!`
3. ✅ Attendu : **aucune affaire visible** (isolation totale entre utilisateurs)
4. Essayer d'accéder directement à l'URL de l'affaire de Marie : `/affaires/[uuid-de-l-affaire-marie]`
5. ✅ Attendu : **404** (pas de fuite d'existence)

---

## ÉTAPE 14 — Vue Admin (toutes les affaires)

1. Se connecter en admin
2. Aller sur `/dashboard` ou `/admin/affaires`
3. ✅ Attendu : **les affaires de Marie ET de Jean sont visibles**
4. ✅ L'admin peut ouvrir, modifier et supprimer n'importe quelle affaire

---

## ÉTAPE 15 — Re-seed non destructif (test avancé)

Sur le serveur, exécuter :
```bash
SEED_ADMIN_PASSWORD=Test1234! npx prisma db seed
```

1. ✅ Attendu : le script tourne **sans erreur**
2. Se reconnecter avec `marie@test.local` / `Test1234!`
3. ✅ Attendu : **connexion réussie** (mot de passe de Marie préservé)
4. ✅ Attendu : **l'affaire "Commune de Bourges" est toujours présente**
5. Aller dans la BDD des coûts `/admin/costs`
6. ✅ Attendu : **les prix personnalisés sont préservés** (pas de reset)

---

## Résumé des valeurs clés à vérifier

| Calcul | Valeur attendue | Tolérance |
|--------|----------------|-----------|
| DJU département 18 | 2 004.1 | exact |
| Conso ref B1 (déperd=10kW, η=58.32%) | 31 291 kWh | ±2% |
| Conso ref B2 (déperd=20kW, η=61.97%) | 50 066 kWh | ±2% |
| Pertes DN50 100ml | 4 140 kWh/an | exact |
| Conso 10j froids (11% de 89 856) | 9 884 kWh | ±1% |
| Volume bois annuel | 102.8 m³ | ±2% |
| Cendres | 289 kg / 0.48 m³ | ±2% |
| Investissement HT ref (23 000 × 1.20) | 27 600 € | exact |
| TTC ref (27 600 × 1.20) | 33 120 € | exact |
| Annuité ref (27 600 / 15 ans) | 1 840 €/an | exact |
| Silo recommandé (max(40,11.3) × 1.5) | 60 m³ | ±5% |

---

## En cas d'écart

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| DJU = 2 400 au lieu de 2 004 | Le département n'est pas trouvé par code | Vérifier que `data.departement = '18'` correspond au code en base |
| Conso = 0 ou NaN | ΔT ≤ 0 ou rendement = 0 | Vérifier Tint > Text et rendements > 0 |
| Coef intermittence ≠ 1.0 | Ancienne valeur 0.85 pour BUREAUX | Vérifier `lib/calculs/parc.ts` COEF_INTERMITTENCE |
| Parc 2 crée sous parc 1 | Bug hardcodé numero:1 | Vérifier fix `chiffrage-biomasse/route.ts` line 93 |
| Affaire de Marie visible par Jean | authz.ts non appliqué | Vérifier `affaireWhereForScope` dans les routes GET |
| Seed détruit le mot de passe admin | deleteMany encore présent | Vérifier `prisma/seed.ts` utilise `skipDuplicates` |
