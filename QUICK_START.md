# ⚡ QUICK START - Test du Parcours Complet

## 🎯 En 10 minutes, validez que l'app fonctionne

```bash
npm run test:parcours
```

### ✅ Résultat attendu:
```
Tests réussis: 15/15 (100%)
🎉 TOUS LES TESTS PASSÉS!
```

### 📊 Ce que le test valide:
- ✓ Création affaire avec 3 bâtiments
- ✓ Création 2 réseaux biomasse (Parc 1 & 2)
- ✓ Calculs = Excel exactement
- ✓ Agrégation par parc OK
- ✓ Structure de données complète

---

## 🔧 Dépannage rapide

| Problème | Solution |
|----------|----------|
| "Module not found" | `npm install && npx prisma generate` |
| "PrismaClient error" | `npx prisma generate` |
| "Database error" | Vérifier `.env.local` a `DATABASE_URL` |
| Test échoue | Vérifier CORRECTIONS 1-3 appliquées |

---

## 🚀 Prochaines étapes (après ✅)

```bash
npm run dev                # Lance serveur
# → http://localhost:3000
# → Créer affaire manuellement
# → Exporter PDF
# → Comparer avec Excel
# → ✅ Production ready!
```

---

## 📁 Fichiers créés

```
scripts/test-parcours-complet.ts  ← Script de test
GUIDE_TEST_PARCOURS.md            ← Guide complet
TEST_PARCOURS_README.md           ← Détails techniques
run-test.sh / run-test.bat        ← Scripts shell/batch
```

## 📞 Besoin d'aide?
Consulter `GUIDE_TEST_PARCOURS.md` pour la documentation complète.
