# Audit DJU — Vérification exhaustive contre l'Excel source

> Date : 10/06/2026 — Source de vérité : `faisabilite_biomasse_version_2.xlsm`, feuille `Meteo`
> (données SDES / INSEE / Météo France, années 1996-2022)

---

## Verdict

**Les 96 départements du seed correspondent exactement à l'Excel — 96/96 ✓**

| Vérification | Méthode | Résultat |
|---|---|---|
| DJU moyens (col. AD « Moyenne ») | comparaison automatisée, tolérance 0,05 | **96/96 identiques** |
| T° ext. de base (col. AF « Text Base ») | comparaison exacte | **96/96 identiques** |
| Départements manquants / en trop | rapprochement par code | **aucun** |
| Suite de tests de parité Excel | `npm test` | **16/16 ✓** |

Échantillon de contrôle :

| Dép. | Nom | Excel (AD / AF) | Seed | |
|---|---|---|---|---|
| 06 | Alpes-Maritimes | 1017.4 / -2 | 1017.4 / -2 | ✓ |
| 18 | Cher | 2004.1 / -7 | 2004.1 / -7 | ✓ |
| 21 | Côte-d'Or | 2262.9 / -10 | 2262.9 / -10 | ✓ |
| 58 | Nièvre | **2162.4 / -10** | 2162.4 / -10 | ✓ |
| 95 | Val-d'Oise | 2005.1 / -7 | 2005.1 / -7 | ✓ |

---

## Pourquoi vous avez vu « 2400 / -8 » pour la Nièvre (58)

Ce ne sont **pas** les bonnes valeurs, et ce n'est pas un hasard :

1. **Votre instance déployée tourne sur l'ancien code (`main`)**, dont le seed contenait des
   valeurs **approximatives inventées** (chiffres ronds) :
   `{ departement: 'Nièvre', code: '58', djuMoyenne: 2400, tempExtBase: -8 }` ← exactement ce que vous voyez.
   D'autres exemples faux sur main : Cher 2250 (réel 2004.1), Alpes-Maritimes 1700 (réel 1017.4).
2. S'y ajoutait un bug de lookup (recherche par nom alors que le formulaire envoie le code) → repli 2400.

**Les deux sont corrigés sur la branche `claude/zealous-lamport-jhjrvj`** (PR en attente de fusion).

## Correctif appliqué dans ce commit : re-seed correcteur

Le seed était volontairement non destructif (`skipDuplicates`), donc il n'aurait **jamais corrigé**
les fausses valeurs déjà présentes dans votre base de production. La table météo passe en **upsert** :

- Les 96 lignes DJU/T° sont désormais **réalignées sur l'Excel à chaque seed** (donnée normative ≠ donnée client).
- Les données client restent intouchées : mots de passe, BDD coûts, affaires — vérifié par re-seed local.
- Sans effet sur les affaires existantes : chaque affaire fige `djuRetenu`/`tempExtBase` à sa création.
  (Une affaire créée avec 2400/-8 garde ces valeurs → la recréer ou éditer son DJU après déploiement.)

**Test reproduit en local** : ligne 58 corrompue à 2400/-8 (état de votre prod) → re-seed → **2162.4/-10** ✓,
comptes et mots de passe intacts ✓.

## Marche à suivre pour corriger votre instance

1. Fusionner la PR (branche `claude/zealous-lamport-jhjrvj`) et déployer.
2. Relancer le seed : `npx prisma db seed` → la table DJU se réaligne automatiquement.
3. Recréer (ou corriger à la main) les affaires de test créées avec les anciennes valeurs.

---

## Constat annexe — pondération « Base 16 » de l'Excel (non bloquant)

La feuille `Meteo` contient une 2ᵉ moyenne (col. AE « Base 16 ») et le formulaire VBA calcule :

```
DJU retenus = (h_confort × DJU_Moyenne + h_réduit × DJU_Base16) / 24
```

L'utilisateur Excel répartissait les 24 h entre « T° confort » et « T° réduit » (réduit de nuit).
Le SaaS utilise directement la moyenne col. AD (équivalent à 24 h confort) et permet de saisir
manuellement un DJU différent — la pondération automatique n'est pas reproduite.

**Impact** : aucun si vos projets chauffent en continu ; pour un usage avec réduit de nuit,
saisir le DJU pondéré à la main dans le champ « DJU retenus ». Reproduire la pondération dans
l'interface (2 champs h_confort / h_réduit + stockage de la col. AE) est faisable sur demande.
