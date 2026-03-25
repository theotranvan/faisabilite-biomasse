# 🚀 GUIDE DE TEST - Parcours Complet en 10 Minutes

Voici comment valider que votre application fonctionne correctement et que les résultats matchent l'Excel.

## ⚡ TL;DR (Trop Long; Pas Lu)

```bash
# Option 1: Automatique (recommandé)
npm run test:parcours

# Option 2: Étape par étape
npm install
npx prisma generate
npx prisma db seed
npx tsx scripts/test-parcours-complet.ts

# Option 3: Windows avec GUI
./run-test.bat  # Ou double-cliquez

# Option 4: Mac/Linux avec bash
bash run-test.sh
```

## 📋 Qu'est-ce que le test effectue?

Le script **`test-parcours-complet.ts`** simule exactement ce que votre client fera:

### ✅ Étape 1: npm install + prisma setup (automatisé)
```bash
npm install
npx prisma generate
npx prisma db seed
```
**Durée:** 2-3 min

### ✅ Étape 2: Créer une affaire avec 3 bâtiments (script)
```
Bâtiment 1: 100m² Logements/Parc 1
Bâtiment 2: 200m² Bureaux/Parc 2
Bâtiment 3: 100m² Logements/Parc 1
```
**Données:** Exactement celle de l'Excel

### ✅ Étape 3: Remplir les états de référence (script)
```
Bât 1: Gaz naturel, rendements 80/90/90/90%
Bât 2: Gaz naturel, rendements 85/90/90/90%
Bât 3: NULL (aucun état fourni)
```

### ✅ Étape 4: Remplir le chiffrage Parc 1 (script)
```
5 chaudières × 5000€ = 25000€
```

### ✅ Étape 5: Vérifier les calculs vs Excel (TEST)
**Bâtiment 1:**
- ✓ Coût annuel EI = 4090.32€
- ✓ Conso ref = 31291.55 kWh

**Bâtiment 2:**
- ✓ Coût annuel EI = 13304.17€
- ✓ Conso ref = 58901.74 kWh ← **BUG CORRIGÉ**: n'était pas 5.89e12!
- ✓ Sortie chaudières = 50066.48 kWh

**Parcs:**
- ✓ Parc 1 (Bât1+Bât3): 25033.24 kWh
- ✓ Parc 2 (Bât2): 50066.48 kWh

### ✅ Étape 6: Vérifier l'affaire complète (TEST)
- ✓ Affaire contient 3 bâtiments
- ✓ Affaire contient 2 parcs
- ✓ Parc 1 a un chiffrage

## 📊 Interpréter les résultats

### ✅ TOUS LES TESTS PASSENT (idéal)
```
Tests réussis: 15/15 (100%)

🎉 TOUS LES TESTS PASSÉS! L'application fonctionne correctement.
```

**Action suivante:**
1. Lancer `npm run dev`
2. Aller sur http://localhost:3000
3. Créer une affaire manuellement avec les mêmes données
4. Aller dans "Résultats" et vérifier les chiffres
5. Exporter un PDF et vérifier le rendu

### ⚠️ CERTAINS TESTS ÉCHOUENT
```
Tests réussis: 12/15 (80%)

⚠️  CERTAINS TESTS ONT ÉCHOUÉ
✗ Bât1: consoRefCalculees = 31291.55
  Expected: 31291.55
  Actual: 31300.12
```

**Action suivante:**
1. Identifier quel test échoue
2. Consulter le fichier de calcul correspondant
3. Vérifier les corrections (CORRECTION 1, 2, 3)
4. Relancer le test

## 🔧 Commandes disponibles

```bash
# Lancer le test complet (installe, seed, teste)
npm run test:parcours

# Lancer uniquement le test (si déjà installé)
npm run test

# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Seeder la base avec les données
npx prisma db seed

# Lancer le serveur de développement
npm run dev

# Builder pour production
npm run build

# Lancer en production
npm start
```

## 📝 Structure du test

```
test-parcours-complet.ts
├─ Étape 1: Créer affaire
├─ Étape 2: Créer 3 bâtiments (insère dans DB)
├─ Étape 3: Créer 2 parcs (insère dans DB)
├─ Étape 4: Vérifier calculs (appelle les fonctions)
│  ├─ Bât 1: coutAnnuelEI, consoRefCalculees
│  └─ Bât 2: coutAnnuelEI, consoRefCalculees, consoSortieChaudieresRef
├─ Étape 5: Vérifier agrégation parcs
│  ├─ Parc 1: consoSortieParc
│  └─ Parc 2: consoSortieParc
├─ Étape 6: Créer chiffrage Parc 1
└─ Étape 7: Vérifier affaire complète
```

## 🐛 Dépannage

### "Module not found"
```bash
npm install
npx prisma generate
```

### "PrismaClient did not initialize"
```bash
npx prisma generate
```

### "Database connection error"
- Vérifier `.env.local` contient `DATABASE_URL`
- Vérifier que la base de données est accessible

### "Script fails randomly"
```bash
npx prisma db reset  # Réinitialise la base
npm run test:parcours
```

## ✅ Checklist avant de montrer au client

- [ ] Lancer `npm run test:parcours`
- [ ] Tous les tests passent (100%)
- [ ] Lancer `npm run dev`
- [ ] Ouvrir http://localhost:3000
- [ ] Créer une affaire manuellement
- [ ] Vérifier les résultats dans "Résultats"
- [ ] Exporter un PDF
- [ ] Comparer avec l'Excel final du client
- [ ] ✅ Déployer en production

## 📞 Besoin d'aide?

Si un test échoue:
1. Lire le message d'erreur (Expected vs Actual)
2. Vérifier les fichiers de calcul
3. S'assurer que toutes les CORRECTIONS sont appliquées
4. Vérifier que Prisma a été régénéré

## 🎯 Objectif

Cette suite de tests valide que:
- ✅ Les données sont correctement stockées en base
- ✅ Les calculs correspondent à l'Excel
- ✅ L'agrégation par parc fonctionne
- ✅ Le chiffrage s'insère sans erreur
- ✅ L'application est prête pour production

**Durée totale:** 5-10 minutes sur une machine lente.
