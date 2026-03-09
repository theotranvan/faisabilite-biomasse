# 🚀 Guide de Test & Déploiement

## 📋 Prérequis

```bash
✅ Node.js 18+
✅ npm ou yarn
✅ SQLite3 (dev.db)
✅ TypeScript 5.3+
```

---

## 🧪 Test Local

### **1. Démarrer l'application**

```bash
cd c:\Users\eddyt\Desktop\FaisabilitéBiomasse

# Installation (si première fois)
npm install

# Générer Prisma
npx prisma generate

# Seed database (si besoin)
npm run seed

# Démarrer dev server
npm run dev
```

**Résultat** :
```
✓ Ready in 1.23s
⟳ Local:        http://localhost:3002
⟳ Environments: .env.local

```

### **2. Accéder à l'application**

Ouvrir navigateur : **http://localhost:3002**

Vous verrez :
```
┌────────────────────────────┐
│   🌿 FAISABILITÉ BIOMASSE  │
│                            │
│   [+ NEW STUDY]            │
│                            │
│   📊 🌱 💰 📈              │
│                            │
│   No studies yet           │
└────────────────────────────┘
```

---

## ✅ Scénario de test complet

### **Test 1 : Navigation**
```
[ ] Charger http://localhost:3002
[ ] Vérifier page d'accueil charge
[ ] Cliquer sur "+ Nouvelle étude"
[ ] Voir formulaire étape 1/3
[ ] Naviguer → Précédent / Suivant
```

### **Test 2 : Formulaire Étape 1 (Affaire)**
```
[ ] Remplir tous les champs obligatoires
    - Nom client : "Test ACME"
    - Ville : "Lyon"
    - Département : "69 - Rhône"
    
[ ] Remplir paramètres climatiques
    - Temp ext : -8
    - Temp int : 20
    - DJU : 2000
    - Durée emprunt : 15
    
[ ] Modifier augmentations
    - Fossile : 3.5%
    - Biomasse : 1.8%
    
[ ] Cliquer "Suivant →"
[ ] Vérifier page 2 charges
```

### **Test 3 : Formulaire Étape 2 (Bâtiments)**
```
[ ] Voir 1 bâtiment pré-rempli
[ ] Modifier désignation : "Bâtiment principal"
[ ] Vérifier déperditions : 20 kW
[ ] Vérifier rendements : 80%, 85%, 85%, 90%
[ ] Modifier consommation : 75000 kWh
[ ] Modifier type énergie : "Gaz naturel"
[ ] Modifier tarif : 0.15 €/kWh
[ ] Ajouter nouveau bâtiment
    [ ] Remplir Désignation : "Annexe"
    [ ] Déperditions : 5 kW
    [ ] Énergie : Électricité
[ ] Cliquer "Suivant →"
```

### **Test 4 : Formulaire Étape 3 (Chiffrage)**
```
[ ] Voir récapitulatif chiffrage
[ ] Entrer sous-total : 25000
[ ] Entrer emprunt : 12000
[ ] Vérifier calculs auto :
    - HT = 30000
    - TVA = 6000
    - TTC = 36000
    
[ ] Cliquer "✓ Créer l'affaire"
```

### **Test 5 : Création & Calculs**
```
[ ] Voir spinner "Calculs en cours"
[ ] Observer progression :
    ✓ Calculs bâtiments
    ✓ Agrégation parcs
    ✓ Chiffrage
    ✓ Bilan 20 ans
    ✓ Émissions CO₂/SO₂
    
[ ] Redirection automatique vers /affaires/[id]/resultats
[ ] Vérifier affaire créée en DB
```

### **Test 6 : Page Résultats**
```
[ ] Dashboard charge
[ ] Titres visible : "Test ACME - Lyon"
[ ] 4 onglets visibles :
    [ ] 📊 Synthèse
    [ ] 🏢 Bâtiments
    [ ] 💰 Bilan 20 ans
    [ ] 🌱 Émissions CO₂

[ ] OngletSynthèse - KPIs affichés :
    [ ] Puissance totale : XX kW
    [ ] Conso annuelle : XX MWh
    [ ] Coût initial : XX €
    [ ] Économies : XX €
    
[ ] Tableau bâtiments affiche :
    - Bâtiment 1 : rendement, conso, coût
    - Bâtiment 2 : rendement, conso, coût
    - (etc...)

[ ] Onglet Bâtiments - Cartes individuelles
[ ] Onglet Bilan 20 ans - Graphique LineChart
    [ ] Voir 3 courbes (initial/ref/biomasse)
    [ ] Hover infobulle
    
[ ] Onglet Émissions - Graphique BarChart
    [ ] Voir barres CO₂
    [ ] Section "Réduction d'émissions"
    
[ ] Boutons [ Imprimer ] [ Exporter PDF ]
```

### **Test 7 : Retour Accueil**
```
[ ] Naviguer vers /dashboard
[ ] Voir affaire créée dans la liste
[ ] Cliquer dessus
[ ] Retour vers résultats ✓
[ ] Créer 2ème affaire
[ ] Voir 2 études listées
```

### **Test 8 : Données réelles (Cas test)**
```
Créer étude avec DATA PROMPT_COPILOT_COMPLET :

Affaire : 
- Client : "Client Test"
- Ville : "Bourges"
- Dept : "18 - Cher"
- DJU : 1977
- Temp ext : -7
- Temp int : 19

Bâtiments :
①  Bâtiment 3 (Parc 1)
    - Déperditions : 20 kW
    - Rendements : 80%, 85%, 85%, 90%
    - Consomm : Fuel, 70189 kWh
    - Tarif : 0.13
    
②  Bâtiment 2 (Parc 2)
    - Déperditions : 20 kW
    - Rendements : 85%, 90%, 90%, 90%
    - Consomm : Électricité, 60000 kWh
    - Tarif : 0.226
    
③  Bâtiment 1 (Parc 1)
    - Déperditions : 10 kW
    - Rendements : 80%, 90%, 90%, 90%
    - Consomm : Fuel, 32000 kWh
    - Tarif : 0.13

Chiffrage :
- Sous-total : 25000
- Emprunt : 9118.96

Résultats attendus :
□ Total Synthèse : 50 kW, 180 MWh, 36 000€, 2 608€/an
□ Bâtiment 3 : 52%, 70189 kWh, 9124.57€
□ Bâtiment 2 : 62%, 138000 kWh, 13304.17€  
□ Bâtiment 1 : 58%, 32000 kWh, 4090.32€
□ Bilan CO₂ : - 70%
□ Graphiques affichés correctement
```

---

## 🐛 Debugging

### **Erreur : "Cannot find module '@/components'"**
```bash
# Régénérer Prisma
npx prisma generate

# Lancer dev server
npm run dev
```

### **Erreur : "Database connection failed"**
```bash
# Recréer DB
rm dev.db

# Seed
npm run seed

# Dev
npm run dev
```

### **Erreur : "Port 3002 already in use"**
```bash
# Trouver process
Get-Process -Id (Get-Net-TCPConnection -LocalPort 3002).OwningProcess

# Tuer process
Stop-Process -Id XXXX -Force

# Ou changer port
npm run dev -- -p 3003
```

### **Résultats incomplets**
```bash
# Vérifier base de données
sqlite3 dev.db "SELECT COUNT(*) FROM Affaire;"

# Vérifier calculs via API
curl http://localhost:3002/api/calculs/[affaireId]
```

---

## 📱 Tests mobiles

### **Responsive Design**
```
[ ] Desktop (1920x1080)
    [ ] Layout correct
    [ ] Tous les éléments visibles
    
[ ] Tablette (768x1024)
    [ ] Grid responsive
    [ ] Boutons accessibles
    
[ ] Mobile (375x812)
    [ ] Stack vertical
    [ ] Tactile OK
    [ ] Scroll fluide
```

### **Navigateurs**
```
[ ] Chrome / Chromium
[ ] Firefox
[ ] Safari
[ ] Edge
```

---

## 🔍 Checklist de qualité

### **Fonctionnalité**
- [ ] Créer affaire ✓
- [ ] Lister affaires ✓
- [ ] Voir résultats ✓
- [ ] Consulter graphiques ✓
- [ ] Exporter ✓

### **Données**
- [ ] Calculs exacts
- [ ] Formules valides
- [ ] Tolerances OK (0.01%)
- [ ] Pas de perte de données

### **UX/UI**
- [ ] Intuitive pour utilisateur non-tech
- [ ] Feedback clair (spinners, toasts)
- [ ] Messages d'erreur explicites
- [ ] Navigation logique

### **Performance**
- [ ] Chargement rapide (< 2s)
- [ ] Pas de lag au scroll/interaction
- [ ] Formulaire fluide
- [ ] Graphiques responsive

### **Accessibilité**
- [ ] Contraste couleurs correct
- [ ] Textes lisibles
- [ ] Alt-text images
- [ ] Keyboard navigation

---

## 📊 Métriques de performance

### **Avant optimisation**
```
First Contentful Paint : ~800ms
Largest Contentful Paint : ~1.2s
Cumulative Layout Shift : 0.05
```

### **Cible**
```
First Contentful Paint : < 800ms ✓
Largest Contentful Paint : < 1s (graphiques)
Cumulative Layout Shift : < 0.1 ✓
```

---

## 🚀 Déploiement

### **Prod checklist**
```
[ ] npm run build -- success
[ ] npm run lint -- 0 errors
[ ] npm test -- all passing
[ ] Env variables configured
[ ] DB migrated
[ ] Monitoring setup
[ ] SSL certificates
[ ] Backups configured
```

### **Deploy commands**
```bash
# Build
npm run build

# Start
npm run start

# Ou avec PM2
pm2 start "npm run start" --name "biomasse"
```

### **Env variables**
```bash
DATABASE_URL="file:./prod.db"
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://api.biomasse.app"
```

---

## 📞 Support & Issues

### **Logs**
```bash
# Dev
npm run dev 2>&1 | tee logs/dev.log

# Prod (avec PM2)
pm2 logs biomasse
```

### **Common issues**
```
Q: Les calculs ne correspondent pas
A: Vérifier tolerance (0.01%), vérifier formules

Q: Graphiques ne s'affichent pas
A: Vérifier Recharts import, vérifier données

Q: Affaires ne se sauvegardent pas
A: Vérifier Prisma connection, vérifier DB

Q: Très lent
A: Vérifier DB indexes, profiler API
```

---

## ✨ Success Criteria

Application est prête si :

✅ **Tous les tests passent**
✅ **Calculs valides (23/23 tests)**
✅ **UI/UX intuitive**
✅ **Aucune erreur console**
✅ **Performance acceptable**
✅ **Responsive design OK**
✅ **Export PDF fonctionne**
✅ **Multi-affaires OK**

---

## 🎉 Livraison

### **Package**
```
src/app/            (pages + API)
src/components/     (UI réutilisable)
lib/calculs/        (moteur calcul)
lib/              (utils, prisma, hooks)
prisma/            (schema + migrations)
public/            (assets)
```

### **Documentation**
```
README.md           (getting started)
UI_SUMMARY.md       (architecture UI)
GUIDE_UTILISATION.md (user guide)
DEPLOYMENT.md       (ops guide)
```

---

**Application prêt pour utilisation production ! 🚀**
