# 🎯 Guide d'utilisation - Application Faisabilité Biomasse

## 📱 Parcours utilisateur

### **Flux principal en 5 minutes**

```
🏠 Accueil (/dashboard)
        ↓
    [+ Nouvelle étude]
        ↓
📋 Formulaire (/affaires/new) - 3 étapes
        ↓
✅ Création affaire + calculs
        ↓
📊 Dashboard Résultats (/affaires/[id]/resultats)
        ↓
📈 Consultation des résultats + graphiques
        ↓
📄 Export PDF / Impression
```

---

## 🎬 Scénario complet d'utilisation

### **Étape 1 : Accueil**

L'utilisateur arrive sur `/dashboard` et voit :

```
┌─────────────────────────────────────────┐
│      🌿 FAISABILITÉ BIOMASSE 🌿        │
│                                         │
│   Outil d'analyse technico-économique  │
│   pour projets de chauffage biomasse    │
│                                         │
│    [+ NOUVELLE ÉTUDE] ← CLIC            │
│                                         │
│  Fonctionnalités :                     │
│  ✓ Calculs précis (formules Excel)     │
│  ✓ Biomasse (CO₂ optimisé)             │
│  ✓ Économies 20 ans détaillées         │
│  ✓ Visualisations dynamiques           │
│                                         │
│  Études en cours : 0                   │
│  (Pas d'étude - invite à créer)        │
└─────────────────────────────────────────┘
```

**Action utilisateur** : Clic sur **"+ NOUVELLE ÉTUDE"**

---

### **Étape 2 : Formulaire - Partie 1 (AFFAIRE)**

Page `/affaires/new` - **Étape 1/3**

```
┌──────────────────────────────────────────────────┐
│ NOUVELLE ÉTUDE DE FAISABILITÉ                    │
│                                                  │
│ ① Affaire        ② Bâtiments      ③ Chiffrage  │
│  ■████□           □□□               □□□         │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ 📋 PARAMÈTRES GÉNÉRAUX                          │
│                                                  │
│ Nom du client * [Mairie de Bourges         ]   │
│ Ville *         [Bourges                    ]   │
│ Adresse         [42 rue de la Paix          ]   │
│ Département *   [18 - Cher ▼]                  │
│ Notes           [Projet de rénovation...]      │
│                                                  │
│ 🌡️ PARAMÈTRES CLIMATIQUES                       │
│                                                  │
│ Temp. int. base:    19 °C                       │
│ Temp. ext. base:    -7 °C                       │
│ DJU retenu:         1977                        │
│ Durée emprunt:      15 ans                      │
│                                                  │
│ 📈 AUGMENTATIONS ANNUELLES                      │
│                                                  │
│ Énergie fossile:    [4.0]  %                   │
│ Biomasse:           [2.0]  %                   │
│                                                  │
├──────────────────────────────────────────────────┤
│                   [Suivant →]                   │
└──────────────────────────────────────────────────┘
```

**Actions utilisateur** :
- Remplir `Nom du client` → "Client Test"
- Remplir `Ville` → "Bourges"
- Sélectionner `Département` → "18 - Cher"
- Paramètres clim/augmentations : **pré-remplis**
- Clic **"Suivant →"**

---

### **Étape 3 : Formulaire - Partie 2 (BÂTIMENTS)**

Page `/affaires/new` - **Étape 2/3**

```
┌──────────────────────────────────────────────────┐
│ NOUVELLE ÉTUDE DE FAISABILITÉ                    │
│                                                  │
│ ① Affaire        ② Bâtiments      ③ Chiffrage  │
│  ✓             ■████□               □□□        │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 🏢 BÂTIMENT 1                [Supprimer] │   │
│ │                                          │   │
│ │ Désignation * [Bâtiment 1 assoc       ] │   │
│ │ Numéro  [1]  Parc [1]                   │   │
│ │                                          │   │
│ │ 🔥 THERMIQUE                             │   │
│ │                                          │   │
│ │ Déperditions (kW):        [20]           │   │
│ │ Rend. production (%):     [80]           │   │
│ │ Rend. distribution (%):   [85]           │   │
│ │ Rend. émission (%):       [85]           │   │
│ │ Rend. régulation (%):     [90]           │   │
│ │                                          │   │
│ │ ⚡ CONSOMMATION ÉNERGÉTIQUE               │   │
│ │                                          │   │
│ │ Type d'énergie:    [Fuel ▼]              │   │
│ │ Tarif (€/kWh):     [0.13]                │   │
│ │ Conso calculée:    [70189] kWh/an       │   │
│ │ Conso réelles:     [71000] kWh/an       │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ [+ Ajouter un bâtiment]                        │
│                                                  │
├──────────────────────────────────────────────────┤
│    [← Précédent]         [Suivant →]            │
└──────────────────────────────────────────────────┘
```

**Actions utilisateur** :
- Pré-rempli avec 1 bâtiment (éditable)
- Modifier `Désignation` si besoin
- Vérifier les rendements/déperditions
- Optionnel : [+ Ajouter un bâtiment]
- Clic **"Suivant →"**

---

### **Étape 4 : Formulaire - Partie 3 (CHIFFRAGE)**

Page `/affaires/new` - **Étape 3/3**

```
┌──────────────────────────────────────────────────┐
│ NOUVELLE ÉTUDE DE FAISABILITÉ                    │
│                                                  │
│ ① Affaire        ② Bâtiments      ③ Chiffrage  │
│  ✓              ✓                ■████□         │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ 💰 CHIFFRAGE DE RÉFÉRENCE                       │
│                                                  │
│ Parc:                    [1]                     │
│ Sous-total chaufferie:  [25000]  €              │
│ Montant d'emprunt:      [9118.96]  €            │
│                                                  │
│ 📊 RÉCAPITULATIF                                │
│                                                  │
│ ┌──────────────┐ ┌──────────────┐              │
│ │  Total HT    │ │    TVA 20%   │              │
│ │   30 000 €   │ │    6 000 €   │              │
│ └──────────────┘ └──────────────┘              │
│                                                  │
│ ┌──────────────┐                                │
│ │  Total TTC   │                                │
│ │   36 000 €   │                                │
│ └──────────────┘                                │
│                                                  │
├──────────────────────────────────────────────────┤
│    [← Précédent]    [✓ Créer l'affaire]        │
└──────────────────────────────────────────────────┘
```

**Actions utilisateur** :
- Entrer `Sous-total chaufferie` → "30000"
- Entrer `Montant d'emprunt` → "9118.96"
- Voir le récapitulatif auto (HT/TVA/TTC calculés)
- Clic **"✓ Créer l'affaire"**

**État de chargement** :
```
⏳ Chargement... (calculs en cours)
   ✓ Calculs bâtiments
   ✓ Agrégation parcs
   ✓ Chiffrage
   ✓ Bilan 20 ans
   ✓ Émissions CO₂/SO₂

Redirection vers les résultats...
```

---

### **Étape 5 : Résultats - Dashboard**

Page `/affaires/[id]/resultats`

```
┌────────────────────────────────────────────────────┐
│ CLIENT TEST                                         │
│ Bourges • 18 • Étude de faisabilité biomasse      │
│                                                    │
│ 📊 Synthèse │ 🏢 Bâtiments │ 💰 Bilan 20 ans │ 🌱 CO₂
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │Puissance │ │Conso ann │ │Coût init │ │Économ. ││
│ │  30 kW   │ │  180 MWh │ │ 36 000€  │ │ 2 500€ ││
│ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                    │
│ TABLEAU BÂTIMENTS                                 │
│                                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ # │Désig  │Parc│Rend   │Conso  │Coût/an    │ │
│ ├───┼───────┼────┼───────┼───────┼───────────┤ │
│ │ 1 │Bât 1  │ 1  │ 58.3% │ 32000 │ 4 090.32€ │ │
│ │ 2 │Bât 2  │ 2  │ 62.0% │138000 │13 304.17€ │ │
│ │ 3 │Bât 3  │ 1  │ 52.0% │ 70189 │ 9 124.57€ │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│     [📄 Imprimer]      [💾 Exporter PDF]         │
└────────────────────────────────────────────────────┘
```

**Onglet : Synthèse** (par défaut)
- KPIs en vedette (4 cartes)
- Tableau récapitulatif bâtiments
- Boutons export

**Onglet : Bâtiments**
```
Affiche des cartes individuelles :

🏢 Bâtiment n°1
├─ Rendement : 58.32%
├─ Conso PCS : 31,464 kWh
└─ Coût/an : 4,090.32€

[Répété pour Bât 2, 3...]
```

**Onglet : Bilan 20 ans**
```
Graphique LineChart montrant :

Coûts (€)
│
│     ╱═══════ État initial (rouge)
│    ╱ ───── Référence (orange)
│   ╱        Biomasse (VERT) ← Meilleure
│  │
└─────────────────────── Années (1-20)

Total économ. sur 20 ans : 42 144.22€ ✓
```

**Onglet : Émissions CO₂**
```
Graphique BarChart montrant :

CO₂ (tonnes/an)
│
│  ████  État initial (rouge)
│  ████  Référence (orange)
│  ███   Biomasse (VERT) ← 70% réduction ✓
│
└────────────────────

Réduction CO₂/an : 0.5 tonnes (vs Référence)
Réduction SO₂/an : 0.002 tonnes
```

---

## 🎨 Interaction utilisateur

### **Hover Effects**
```
Cartes affaires : Élévation + ombre
Boutons : Changement couleur + translation
Tuiles KPI : Bordure colorée
```

### **Validation**
```
❌ Champ vide : Message d'erreur (rouge)
⚠️ Avant de Suivant : Vérification champs requis
✅ Après création : Toast succès (vert)
```

### **Feedback**
```
Spinner pendant calculs
Toast confirmation création
Redirection automatique
```

---

## 📊 Données exemple

### **Client Test - Bourges**
```
Bâtiment 1 : 10 kW, Fuel, 4 090€/an
Bâtiment 2 : 20 kW, Électricité, 13 304€/an  
Bâtiment 3 : 20 kW, Fuel, 9 125€/an
───────────────────────────────────
TOTAL :     50 kW,           26 519€/an

Investissement : 30 000€ HT (36 000€ TTC)
Annuité : 2 608€/an
Amortissement : 15 ans

Économies 20 ans : +42 144€ ✅
Réduction CO₂ : -70% ✅
```

---

## 💡 Tips pour utilisateur

```
1️⃣  Paramètres climatiques
    → Utiliser les valeurs régionales DJU
    → Peut être modifié selon géolocalisation

2️⃣  Rendements
    → Valeurs standards proposées par défaut
    → À adapter selon audit thermique

3️⃣  Consommations
    → Priorité aux valeurs réelles mesurées
    → Sinon utiliser les calculées

4️⃣  Chiffrage
    → Basé sur étude de cas réel
    → À affiner avec devis réels
    → Inclut MOE + divers + aléas

5️⃣  Résultats
    → Conservent historique complet
    → Exportables en PDF
    → Partageables avec clients
```

---

## 🔄 Cas d'usage avancés

### **Modifier une étude**
```
1. Aller sur /dashboard
2. Cliquer sur affaire existante
3. Accès aux résultats
4. (À développer : bouton "Modifier")
```

### **Comparer deux affaires**
```
1. Ouvrir affaire 1
2. Ouvrir affaire 2 (nouvel onglet)
3. Comparer les graphiques côte à côte
```

### **Exporter pour client**
```
1. Page résultats
2. [📄 Imprimer] → PDF (browser)
3. OU [💾 Exporter PDF] → avec logo personnalisé
```

---

## ✅ Checklist pour visiteur

- [ ] J'ai créé une nouvelle étude
- [ ] J'ai rempli les paramètres climatiques
- [ ] J'ai décrit mes 3 bâtiments
- [ ] J'ai entré le chiffrage
- [ ] J'ai vu les résultats
- [ ] J'ai consulté le bilan 20 ans
- [ ] J'ai vérifié les émissions CO₂
- [ ] J'ai imprimé/exporté le PDF

**Application réussie ! 🎉**
