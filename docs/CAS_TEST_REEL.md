# Cas test réel — Affaire complète à saisir

> Scénario : Commune de Saint-Amand-en-Puisaye (Nièvre, 58)  
> Remplacement de 3 chaudières fioul par une chaufferie bois sur 1 parc.  
> Toutes les valeurs sont à saisir telles quelles.

---

## PRÉ-REQUIS — Créer le compte de test

Une seule commande à lancer depuis le projet (utilise la base pointée par `.env`) :

```bash
npx tsx scripts/create-test-user.ts
```

Crée `test@biomasse.local` / `TestBiomasse2026!` (rôle ADMIN), **sans toucher au compte
du client** ni aux autres données. Idempotent : relancer ne fait que réinitialiser le mot
de passe du compte test. Personnalisable :
`npx tsx scripts/create-test-user.ts --email moi@test.local --password "MonMdp1!" --role USER`

> Vérifié de bout en bout : connexion réelle → session ADMIN ; mauvais mot de passe → 401.

---

## CONNEXION

| Champ | Valeur |
|-------|--------|
| E-mail | `test@biomasse.local` |
| Mot de passe | `TestBiomasse2026!` |

> Compte de test dédié (rôle ADMIN), distinct du compte du client `admin@biomasse.local`.

---

## 1. NOUVELLE AFFAIRE

Menu → **Nouvelle affaire**

| Champ | Valeur |
|-------|--------|
| Nom de l'affaire | `Commune de Saint-Amand — Chaufferie bois` |
| Référence | `2026-SA58-001` |
| Département | `58` |
| DJU retenus | _(laisser vide — doit se remplir auto à **2 162.4**)_ |
| Température intérieure | `19` |
| Température extérieure de base | `-10` _(valeur météo réelle du dép. 58 ; se remplit auto)_ |
| Durée d'emprunt | `15` |
| Nombre de parcs | `1` |

Cliquer **Enregistrer**

✅ Vérifier que **DJU = 2 162.4** et **Text = -10** s'affichent après sauvegarde (lookup météo dép. 58).

---

## 2. BÂTIMENT 1 — École primaire Jules Ferry

Onglet Bâtiments → **Ajouter**

### Informations générales

| Champ | Valeur |
|-------|--------|
| Désignation | `École primaire Jules Ferry` |
| Type de bâtiment | `Enseignement` |
| Parc | `1` |
| Surface chauffée | `450` m² |
| Année de construction | `1978` |

### État initial (situation actuelle — fioul)

| Champ | Valeur |
|-------|--------|
| Énergie | `Fioul` |
| Prix énergie | `0.130` €/kWh |
| Consommation mesurée | `58 000` kWh/an |
| Déperditions | `18` kW |
| Rendement production | `75` % |
| Rendement distribution | `90` % |
| Rendement émission | `90` % |
| Rendement régulation | `90` % |
| Coef. intermittence | `1.0` |

### État de référence (remplacement par gaz naturel)

| Champ | Valeur |
|-------|--------|
| Énergie | `Gaz naturel` |
| Prix énergie | `0.0978` €/kWh |
| Déperditions | `18` kW |
| Rendement production | `82` % |
| Rendement distribution | `90` % |
| Rendement émission | `90` % |
| Rendement régulation | `95` % |
| Coef. intermittence | `1.0` |

Cliquer **Enregistrer**

---

## 3. BÂTIMENT 2 — Salle polyvalente

Onglet Bâtiments → **Ajouter**

### Informations générales

| Champ | Valeur |
|-------|--------|
| Désignation | `Salle polyvalente` |
| Type de bâtiment | `Bureaux` |
| Parc | `1` |
| Surface chauffée | `320` m² |
| Année de construction | `1985` |

### État initial (fioul)

| Champ | Valeur |
|-------|--------|
| Énergie | `Fioul` |
| Prix énergie | `0.130` €/kWh |
| Consommation mesurée | `35 000` kWh/an |
| Déperditions | `13` kW |
| Rendement production | `78` % |
| Rendement distribution | `88` % |
| Rendement émission | `92` % |
| Rendement régulation | `90` % |
| Coef. intermittence | `1.0` |

### État de référence (gaz naturel)

| Champ | Valeur |
|-------|--------|
| Énergie | `Gaz naturel` |
| Prix énergie | `0.0978` €/kWh |
| Déperditions | `13` kW |
| Rendement production | `82` % |
| Rendement distribution | `88` % |
| Rendement émission | `92` % |
| Rendement régulation | `95` % |
| Coef. intermittence | `1.0` |

Cliquer **Enregistrer**

---

## 4. BÂTIMENT 3 — Bibliothèque municipale

Onglet Bâtiments → **Ajouter**

### Informations générales

| Champ | Valeur |
|-------|--------|
| Désignation | `Bibliothèque municipale` |
| Type de bâtiment | `Bureaux` |
| Parc | `1` |
| Surface chauffée | `180` m² |
| Année de construction | `1992` |

### État initial (électricité)

| Champ | Valeur |
|-------|--------|
| Énergie | `Électricité` |
| Prix énergie | `0.226` €/kWh |
| Consommation mesurée | `18 000` kWh/an |
| Déperditions | `8` kW |
| Rendement production | `100` % |
| Rendement distribution | `100` % |
| Rendement émission | `100` % |
| Rendement régulation | `95` % |
| Coef. intermittence | `1.0` |

### État de référence (gaz naturel)

| Champ | Valeur |
|-------|--------|
| Énergie | `Gaz naturel` |
| Prix énergie | `0.0978` €/kWh |
| Déperditions | `8` kW |
| Rendement production | `82` % |
| Rendement distribution | `100` % |
| Rendement émission | `100` % |
| Rendement régulation | `95` % |
| Coef. intermittence | `1.0` |

Cliquer **Enregistrer**

---

## 5. CHIFFRAGE RÉFÉRENCE — Parc 1

Onglet **Chiffrage → Référence → Parc 1**

### Travaux Chaufferie (supprimer les lignes pré-remplies et saisir) :

| # | Désignation | Unité | Qté | P.U. (€) | Total attendu |
|---|-------------|-------|-----|-----------|---------------|
| 1 | Chaudière gaz condensation 60 kW | unité | 1 | 12 000 | 12 000 € |
| 2 | Chaudière gaz condensation 30 kW (appoint) | unité | 1 | 8 500 | 8 500 € |
| 3 | Réseau hydraulique en chaufferie | forfait | 1 | 4 500 | 4 500 € |
| 4 | Ballon tampon 500L | unité | 1 | 1 800 | 1 800 € |
| 5 | Régulation | forfait | 1 | 3 200 | 3 200 € |
| 6 | Réseau de distribution enterré | ml | 120 | 180 | 21 600 € |

**Sous-total Chaufferie ✅ : 51 600 €**

### Frais Annexes :

| Champ | Valeur |
|-------|--------|
| Bureau de Contrôle | `0.04` _(4%)_ |
| Maîtrise d'œuvre | `0.13` _(13%)_ |
| Frais Divers | `0.02` _(2%)_ |
| Aléas | `0.05` _(5%)_ |

- **Total taux ✅ : 24.0%**
- **Frais Annexes ✅ : 12 384 €** (51 600 × 24%)
- **Total HT ✅ : 63 984 €**
- **Total TTC ✅ : 76 781 €**

### Exploitation & Financement :

| Champ | Valeur |
|-------|--------|
| Montant P2 (maintenance) | `1 200` €/an |
| Montant d'emprunt | `63 984` € |

Cliquer **Enregistrer**

---

## 6. CHIFFRAGE BIOMASSE — Parc 1

Onglet **Chiffrage → Biomasse → Parc 1**

### Paramètres de la chaudière bois :

| Champ | Valeur |
|-------|--------|
| Puissance chaudière bois | `80` kW |
| Rendement chaudière bois | `85` % |
| % couverture bois | `80` % |
| Type de combustible | `Plaquettes forestières` |
| PCI | `3.2` MWh/t |
| Masse volumique | `250` kg/m³ |
| Taux d'humidité | `0.30` _(30%)_ |
| Taux de cendres | `0.015` _(1.5%)_ |
| Volume camion | `30` m³ |
| Longueur réseau chaleur | `120` ml |
| Section réseau | `DN63` |

### Travaux Biomasse :

| Désignation | Unité | Qté | P.U. (€) | Total attendu |
|-------------|-------|-----|-----------|---------------|
| Chaudière bois plaquettes 80 kW | unité | 1 | 65 000 | 65 000 € |
| Local chaudière / génie civil | forfait | 1 | 28 000 | 28 000 € |
| Silo béton 60 m³ | forfait | 1 | 22 000 | 22 000 € |
| Réseau de chaleur enterré DN63 | ml | 120 | 230 | 27 600 € |
| Installation réseau bâtiments | forfait | 1 | 8 500 | 8 500 € |
| Chaudière appoint gaz 40 kW | unité | 1 | 7 500 | 7 500 € |
| Électricité / contrôle-commande | forfait | 1 | 6 000 | 6 000 € |

**Sous-total bio ✅ : 164 600 €**

### Frais Annexes Biomasse : _(même taux que référence)_

| Champ | Valeur |
|-------|--------|
| Bureau de Contrôle | `0.04` |
| Maîtrise d'œuvre | `0.13` |
| Frais Divers | `0.02` |
| Aléas | `0.05` |

- **Frais Annexes ✅ : 39 504 €** (164 600 × 24%)
- **Total HT bio ✅ : 204 104 €**
- **Total TTC bio ✅ : 244 925 €**

### Subventions :

| Champ | Valeur |
|-------|--------|
| COT-EnR (Région) | `0.30` _(30%)_ |
| Aide départementale | `0.15` _(15%)_ |
| DETR/DSIL | `0.25` _(25%)_ |

- **Total subventions ✅ : 70%** soit **142 873 €**
- **Reste à charge HT ✅ : 61 231 €**

### Exploitation :

| Champ | Valeur |
|-------|--------|
| Montant P2 biomasse | `4 500` €/an |
| Prix bois | `120` €/t |
| Emprunt biomasse | `61 231` € |

Cliquer **Enregistrer**

---

## 7. RÉSULTATS À VÉRIFIER

### Onglet Résultats / Bilan technique

Avec ΔT = 19 − (−10) = **29 °C** et DJU = **2 162.4** (valeurs exactes vérifiées via le code de calcul de l'app) :

**Bâtiment 1 — École (déperd=18kW, η_ref = 0.82×0.90×0.90×0.95 = 63.10%)**
- Conso ref = (18 × 1000 × 2162.4 × 24) / (29 × 0.6310 × 1000)
- ✅ **Attendu = 51 050 kWh/an** _(conso PCS gaz ×1.1 = 56 155 kWh)_

**Bâtiment 2 — Salle (déperd=13kW, η_ref = 0.82×0.88×0.92×0.95 = 63.07%)**
- Conso ref = (13 × 1000 × 2162.4 × 24) / (29 × 0.6307 × 1000)
- ✅ **Attendu = 36 888 kWh/an** _(conso PCS gaz ×1.1 = 40 577 kWh)_

**Bâtiment 3 — Bibliothèque (déperd=8kW, η_ref = 0.82×1.0×1.0×0.95 = 77.90%)**
- Conso ref = (8 × 1000 × 2162.4 × 24) / (29 × 0.7790 × 1000)
- ✅ **Attendu = 18 378 kWh/an** _(conso PCS gaz ×1.1 = 20 216 kWh)_

**Consommation totale parc (3 bâtiments) ✅ = 106 317 kWh/an**

### Résultats biomasse attendus _(valeurs exactes du code, PCI 3.2 MWh/t, mv 250 kg/m³, humidité 30%, cendres 1.5%)_

| Calcul | Valeur attendue |
|--------|----------------|
| Pertes réseau DN63 120 ml (0.017 × 120 × 3450) | **7 038 kWh/an** |
| Conso totale avec pertes | **113 355 kWh/an** |
| Sortie chaudière bois (80%) | **90 684 kWh** |
| Entrée chaudière bois (η=85%) | **106 687 kWh** |
| Volume bois annuel | **33.3 t / 133.4 m³** |
| Conso 10j froids (11%) | **11 736 kWh (14.7 m³)** |
| Silo recommandé (max(30, 14.7m³) × 1.5) | **45 m³** |
| Nb livraisons (133.4 / 30) | **4.4 livraisons/an** |
| Cendres (masse sèche 23.3t × 1.5%) | **350 kg / 0.58 m³/an** |
| Coût bois annuel (33.3t × 120€) | **≈ 3 996 €/an** |

### Bilan économique attendu (année 1)

| Scénario | Coût énergie annuel | + P2 | + Annuité emprunt | Total approx. |
|----------|--------------------|------|-------------------|---------------|
| Actuel (fioul 0.13 + élec 0.226) | (58k+35k)×0.13 + 18k×0.226 = **16 158 €** | — | — | ≈ **16 158 €/an** |
| Référence gaz | conso PCS 116 948 × 0.0978 = **11 438 €** | 1 200 | 63 984/15 = 4 266 | ≈ **16 904 €/an** |
| Biomasse | bois ≈ 3 996 + appoint gaz ≈ 2 600 = **≈ 6 600 €** | 4 500 | 61 231/15 = 4 082 | ≈ **15 180 €/an** |

> Les montants énergie sont calculés exactement (conso × tarif) ; le bilan complet dépend aussi du rendement de l'appoint et des hypothèses d'indexation → vérifier les chiffres affichés par l'app.

✅ Le scénario biomasse doit ressortir **le moins cher** des trois sur la durée.  
✅ Le graphique 20 ans doit montrer une économie cumulée **positive et croissante** face au gaz.

---

## 8. VÉRIFICATIONS FINALES

| Test | Attendu |
|------|---------|
| DJU affiché | **2 162.4** (département 58) |
| Étiquette DPE École | 58 000 kWh / 450 m² = **129 kWh/m²/an** → vérifier la classe affichée |
| Étiquette DPE Salle | 35 000 / 320 = **109 kWh/m²/an** → vérifier la classe affichée |
| Étiquette DPE Bibli | 18 000 / 180 = **100 kWh/m²/an** → vérifier la classe affichée |
| Logout + autre user | Affaire invisible, accès URL directe → **404** |
| Re-seed | Mot de passe + affaire + coûts intacts |
| Export PDF | PDF généré avec toutes les valeurs |

---

## Valeurs de contrôle rapide (récapitulatif)

Après avoir tout saisi, ces 6 chiffres permettent de valider l'ensemble du flux :

1. **DJU** = `2 162.4` ✅
2. **Conso totale parc réf** = `106 317` kWh/an ✅
3. **Investissement HT ref** = `63 984` € ✅
4. **Investissement HT bio** = `204 104` € ✅
5. **Subventions bio** = `142 873` € (70%) ✅
6. **Volume bois annuel** = `133.4` m³ ✅

Si ces 6 valeurs sont correctes → toute la chaîne de calcul est opérationnelle.
