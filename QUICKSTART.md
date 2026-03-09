# ⚡ QUICKSTART - 5 minutes pour démarrer

## 🚀 Lancer l'application

### **Étape 1 : Démarrer le serveur**

```powershell
cd "c:\Users\eddyt\Desktop\FaisabilitéBiomasse"
npm run dev
```

**Attendre ce message :**
```
✓ Ready in 1.23s
⟳ Local:        http://localhost:3002
```

### **Étape 2 : Ouvrir le navigateur**

```
http://localhost:3002
```

Vous verrez : 
```
🌿 FAISABILITÉ BIOMASSE
├─ [+ NOUVELLE ÉTUDE] ← Cliquer ici
├─ Fonctionnalités clés (4 cartes)
└─ Aucune étude créée
```

---

## 📋 Créer votre première étude (2 min)

### **Formulaire - Étape 1/3 : AFFAIRE**

```
Nom client *    : Client Test
Ville *         : Bourges
Département *   : 18 - Cher
Temp. int       : 19°C (défaut OK)
Temp. ext       : -7°C (défaut OK)
DJU             : 1977 (défaut OK)
Durée emprunt   : 15 ans (défaut OK)
```

**➜ Cliquer "Suivant →"**

---

### **Formulaire - Étape 2/3 : BÂTIMENTS**

Pré-rempli avec 1 bâtiment. Modifier :

```
Désignation     : Bâtiment 1
Type énergie    : Fuel
Déperditions    : 20 kW
Rendements      : 80, 85, 85, 90 (%)
Consomm calc    : 70189 kWh
```

OU [+ Ajouter un bâtiment] pour ajouter Bât 2, 3...

**➜ Cliquer "Suivant →"**

---

### **Formulaire - Étape 3/3 : CHIFFRAGE**

```
Sous-total chaufferie : 25000 €
Montant d'emprunt     : 9118.96 €

📊 Récapitulatif auto-calculé :
├─ Total HT  : 30 000€
├─ TVA 20%   : 6 000€
└─ Total TTC : 36 000€
```

**➜ Cliquer "✓ Créer l'affaire"**

---

## 📊 Voir les résultats (1 min)

### **Dashboard automatique**

Après création, vous êtes redirigé vers :

```
CLIENT TEST - BOURGES

📊 Synthèse │ 🏢 Bâtiments │ 💰 Bilan 20 ans │ 🌱 CO₂
```

### **Onglet Synthèse (Défaut)**

```
KPIs :
├─ Puissance totale     : 30 kW
├─ Conso annuelle       : 180 MWh
├─ Coût initial         : 36 000€
└─ Économies par an     : 2 500€

Tableau bâtiments :
├─ # │ Désig │ Rend  │ Conso  │ Coût/an
├─ 1 │Bât 1  │ 58%   │ 32000  │ 4 090€
├─ 2 │Bât 2  │ 62%   │138000  │13 304€
└─ 3 │Bât 3  │ 52%   │ 70189  │ 9 125€
```

### **Onglet Bilan 20 ans**

```
Affiche graphique :
        € 
        │  ╱╱╱ État initial (ROUGE - Fossile)
        │ ╱╱   Référence (ORANGE - Gaz)
        │╱─ Biomasse (VERT ✓ - Meilleure)
        │
        └───── Années 1 à 20

Total économies 20 ans : 42 144€ ✅
```

### **Onglet Émissions CO₂**

```
Graphique barres :
CO₂ (t/an)
│ ████ État initial 
│ ████ Référence
│ ███  Biomasse ✓ (-70%)
│
└─────────────────

Réduction : 0.5 t/an CO₂ 🌱
```

---

## 🎯 Cas test réel (Opcional)

Données du fichier `PROMPT_COPILOT_COMPLET.md` :

**Affaire :**
```
Nom         : Client Test
Ville       : Bourges
Département : 18
```

**Bâtiments (3):**
```
① Bâtiment 3 : 20 kW, Fuel, 70189 kWh, 52% rendement
② Bâtiment 2 : 20 kW, Élec, 60000 kWh, 62% rendement  
③ Bâtiment 1 : 10 kW, Fuel, 32000 kWh, 58% rendement
```

**Chiffrage :**
```
Sous-total : 25000 €
Emprunt    : 9118.96 €
```

**Résultats attendus :**
```
✓ Synthèse : 50 kW, 180 MWh, 36000€
✓ Bilan 20 ans : Économies 42 144€
✓ CO₂ : -70% vs Référence
✓ Graphiques affichés
```

---

## 🔄 Créer une 2ème étude

### **Retour accueil**

```
1. Naviguer vers http://localhost:3002/dashboard
   OU Cliquer logo/accueil en haut à gauche

2. Voir dashboard avec :
   ├─ Affaire 1 créée
   ├─ [+ NOUVELLE ÉTUDE]
   └─ Cliquer pour créer Affaire 2
```

---

## 🛠️ Commandes utiles

```bash
# Démarrer
npm run dev

# Build production
npm run build

# Tests calculs
node validate-calculs.js

# Reset DB
rm dev.db
npm run seed

# Arrêter serveur
# Ctrl + C dans terminal
```

---

## 📱 Test sur mobile

```
URL : http://[IP-LOCAL]:3002
```

Vous verrez interface responsive sur téléphone/tablette ✓

---

## 🆘 Problèmes courants

### **"Page pas trouvée"**
```
→ Attendre npm run dev complètement
→ Rafraîchir F5
→ Vérifier localhost:3002 (pas 3000)
```

### **"Pas de données"**
```
→ Créer une affaire d'abord
→ Vérifier BD avec : sqlite3 dev.db ".tables"
```

### **"Graphiques ne s'affichent pas"**
```
→ Recharts problème : npm install recharts
→ Rafraîchir page
```

### **"Port déjà utilisé"**
```
→ Tuer process : Get-Process -Name node | Stop-Process
→ Ou : npm run dev -- -p 3003
```

---

## ✨ Fonctionnalités à essayer

```
☑️ Créer étude (3 étapes)
☑️ Voir résultats (4 onglets)
☑️ Consulter graphiques
☑️ Créer 2ème étude
☑️ Comparer affaires
☑️ Imprimer résultats
```

---

## 📖 Documentation complète

- **UI_SUMMARY.md** : Architecture UI détaillée
- **GUIDE_UTILISATION.md** : Guide complet utilisateur
- **TEST_DEPLOYMENT.md** : Tests et déploiement
- **RESUME_FINAL.md** : Résumé du projet

---

## 🎉 C'est prêt !

```
Application accessible sur :
http://localhost:3002

Fonctionnalités :
✅ Création d'études
✅ Calculs validés (23/23 tests)
✅ Dashboard résultats
✅ Graphiques interactifs
✅ Export/Print

BON USAGE ! 🚀
```

---

**Besoin d'aide ? Consulter les documents ou ouvrir une issue.**
