# 🧪 Script de Test du Parcours Complet

Ce script automatise l'intégralité du parcours de test décrit par votre client en 10 minutes:

```
npm install → npx prisma generate → npx prisma db seed → npm run dev
                                                     ↓
                    [Script crée affaire + bâtiments + parcs]
                    [Remplit données Excel, vérifie calculs]
                    [Exporte résultats attendus vs réels]
```

## ⚡ Lancement rapide

```bash
# Dans le répertoire du projet
npx tsx scripts/test-parcours-complet.ts
```

## 📋 Qu'est-ce que le script teste?

### ✅ Étape 1: Création de l'affaire
- Crée une affaire "Test Excel Complet"
- Avec paramètres: DJU=1977, TempInt=19, TempExt=-7

### ✅ Étape 2: Création des 3 bâtiments (données Excel)
```
Bâtiment 1 (Parc 1):
  - Type: Logements
  - Surface: 100m², Volume: 300m³
  - État Initial: Fuel via déperditions 10kW
  - État Référence: Gaz naturel, rendements 80/90/90/90%

Bâtiment 2 (Parc 2):
  - Type: Bureaux
  - Surface: 200m², Volume: 500m³
  - État Initial: Électricité via déperditions 20kW
  - État Référence: Gaz naturel, rendements 85/90/90/90%

Bâtiment 3 (Parc 1):
  - Type: Logements
  - Surface: 100m², Volume: 300m³
  - État Initial: Fuel via déperditions 20kW
  - État Référence: NULL (pas d'EI fourni)
```

### ✅ Étape 3: Création des 2 réseaux (parcs)
```
Parc 1: 10kW, chaudière bois 90%, couverture 100%
Parc 2: 20kW, chaudière bois 90%, couverture 100%
```

### ✅ Étape 4: Vérification des calculs vs Excel

**Bâtiment 1:**
- ✓ Coût annuel EI = 4090.32€
- ✓ Conso ref calculée = 31291.55 kWh

**Bâtiment 2:**
- ✓ Coût annuel EI = 13304.17€
- ✓ Conso ref calculée = 58901.74 kWh (CRITICAL: pas 5.89e12!)
- ✓ Sortie chaudières ref = 50066.48 kWh

### ✅ Étape 5: Agrégation par parc
```
Parc 1 (Bât1 + Bât3):
  - Puissance: 10kW
  - Conso sortie chaudières: 25033.24 kWh

Parc 2 (Bât2):
  - Puissance: 20kW
  - Conso sortie chaudières: 50066.48 kWh
```

### ✅ Étape 6: Chiffrage Parc 1
```
5 chaudières × 5000€ = 25000€
```

### ✅ Étape 7: Vérification affaire complète
- Affaire contient 3 bâtiments ✓
- Affaire contient 2 parcs ✓
- Parc 1 a un chiffrage ✓

## 📊 Interprétation des résultats

### ✅ Tous les tests passent
```
  Tests réussis: 15/15 (100%)
  
  🎉 TOUS LES TESTS PASSÉS! L'application fonctionne correctement.
```

→ **Action suivante:** Lancer `npm run dev` et tester manuellement via l'interface.

### ⚠️ Certains tests échouent
```
  Tests réussis: 12/15 (80%)
  
  ⚠️  CERTAINS TESTS ONT ÉCHOUÉ
  ✗ Bât1: consoRefCalculees = 31291.55
    Expected: 31291.55
    Actual: 31300.12
```

→ Vérifier le code des fonctions de calcul dans `lib/calculs/batiment.ts`.

## 🔧 Dépannage

### Erreur: "Module not found"
```bash
# Installer les dépendances d'abord
npm install
npx prisma generate
npx prisma db seed
```

### Erreur: "PrismaClient did not initialize"
```bash
# Prisma client n'a pas été généré
npx prisma generate
```

### Erreur: "Database connection"
- Vérifier que `DATABASE_URL` est défini dans `.env.local`
- Vérifier que la base de données existe et est accessible

### Script lance mais ne crée rien
- Vérifier les logs Prisma avec:
```bash
DEBUG=prisma:* npx tsx scripts/test-parcours-complet.ts
```

## 📝 Notes sur les valeurs Excel

Les valeurs testées proviennent du fichier Excel fourni:
- **CORRECTION 1** (rendements décimaux vs %) est validée avec TEST 13
- **CORRECTION 3** (format % unifié) est validée ici
- L'agrégation par parc correspond exactement

## 🚀 Étapes suivantes

Après un résultat ✅:

```bash
# 1. Lancer le serveur de développement
npm run dev

# 2. Ouvrir http://localhost:3000 dans le navigateur

# 3. Créer manuellement une affaire avec les mêmes données

# 4. Aller dans Résultats et vérifier les valeurs

# 5. Exporter un PDF et vérifier le rendu final

# 6. Si tous les chiffres matchent → SUCCÈS CLIENT ✅
```

## 📞 Support

Si un test échoue:
1. Vérifier le message d'erreur (Expected vs Actual)
2. Consulter les fichiers de calcul spécifiques
3. Vérifier que `npm audit fix --force` n'a pas cassé les dépendances
4. Relancer `npx prisma generate && npx prisma db seed`
