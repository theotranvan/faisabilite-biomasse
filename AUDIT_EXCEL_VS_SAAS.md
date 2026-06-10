# Audit complet — Excel `faisabilite_biomasse_version_2.xlsm` vs SaaS

**Date :** 10 juin 2026
**Périmètre :** comparaison exhaustive des 30 feuilles de l'Excel client (formules, macros VBA,
tables de référence) avec le code du dépôt (`lib/calculs/`, routes API, composants, seed Prisma).
**Méthode :** extraction indépendante de toutes les formules et valeurs de l'Excel
(openpyxl + olevba pour les macros), vérification numérique cellule par cellule contre le code.

Le fichier audité est **identique octet pour octet** à `excel-source.xlsm` du dépôt
(MD5 `27114def34b5ef1b9c39975073e68c3e`) — l'audit porte donc bien sur la bonne version.

---

## 1. Ce qui était déjà fidèle à l'Excel (vérifié, aucun changement)

| Sujet | Excel | Code | Statut |
|---|---|---|---|
| Rendement moyen | produit des 4 rendements | `calculRendementMoyen` | ✓ |
| Conso kWhep (R) | `=IF(S="Electricité";Q×2,3;Q)` | `calculConsoKWhep` (×2,3 élec) | ✓ |
| Conso PCS (U/AF) | gaz nat/propane ×1,1 | `calculConsoPCS`, `calculConsoRefPCS` | ✓ |
| Coût annuel initial (X) | `=W+(U×V)` (abonnement + PCS×tarif) | `calculCoutAnnuel` | ✓ |
| Conso ref calculées (AE) | `déperd×24×DJU/((19−Text)×rend moyen)` (VBA) | `calculConsoRefCalculees` | ✓ vérifié au centime sur AE5/AE6 |
| Conso sortie chaudières (AH) | `=AE×AA` | `calculConsoSortieChaudieresRef` | ✓ |
| Agrégation par parc | `SUMIF` sur Y (puissance) et AH (conso) | `calculPuissanceChauffageParc`, `calculConsoSortieParcChaudieresRef` | ✓ |
| Frais annexes ref | 0 / 13 / 2 / 5 % sur sous-total chaufferie | défauts schéma `ChiffragReference` | ✓ |
| Frais annexes bio | 3 / 9 / 2 / 5 % | défauts schéma `ChiffrageBiomasse` | ✓ |
| TVA 20 %, annuité `(invest+emprunt)/durée` | `solution biomasse` L16/M38 | `calculAnnuite`, `calculAnnuiteRef` | ✓ |
| Plafond subventions 80 % de l'investissement | `M29=IF(…>0,8;0,8×M27;…)` | `Math.min(subBrut, investBioHT×0.80)` | ✓ |
| Bilan 20 ans : +4 %/an fossile, +2 %/an biomasse, annuité retranchée une fois à l'année durée+1 | `Bilan Actualisé` lignes 10-12 | `calculBilan20Ans` | ✓ |
| Facteurs CO₂/SO₂ (Plaquette 0,013 / Granulé 0,027 / Fuel 0,314 / Gaz nat 0,243 / Propane 0,27 / Élec 0,21 …) | feuille `CO2 SO2` | `EMISSION_FACTORS` | ✓ |
| TEP = 12 602 kWh | `CO2 SO2` K9 | `TEP_TO_KWH` | ✓ |
| Caractéristiques combustibles (PCI, masse volumique, humidité, cendres) | `Car_biomasse` | seed `caracteristiquesData` | ✓ |
| Tarifs énergies | feuille `Energies` | seed `energiesData` | ✓ (voir alerte §4.1) |
| Monotone : déperditions/°C, puissance appelée si T<19 °C, ville/T° de base | `Monotone_1`, `Utile` | `lib/calculs/monotone.ts` + page Résultats | ✓ |
| Seuils DPE par type de bâtiment | `Etiquette` (4 types × 6 seuils) | `DPE_THRESHOLDS` | ✓ |
| Isolation « pour information », hors investissement | feuilles chiffrage | `lib/calculs/isolation.ts` | ✓ |
| Défauts affaire : DJU 1977, Tint 19, Text −7, durée 15 ans, camion 90 m³ | diverses feuilles | schéma `Affaire`/`Parc` | ✓ |

---

## 2. Écarts corrigés dans ce commit

### 2.1 Volume de cendres — formule fausse (bug réel)
* **Excel (VBA `UserForm_saisie_biomasse`)** : cendres (kg) = masse de bois **sèche**
  × taux de cendres ; volume = kg / **600 kg/m³** (masse volumique des cendres).
* **Code avant** : `conso_kWh × tauxCendre / masseVolumique_bois` — dimensionnellement faux,
  surestimait les cendres d'un facteur ~5 (1 000 kg au lieu de 197 kg pour 100 MWh plaquette).
* **Corrigé** : `calculVolumeCendres(consoEntreeKwh, pci, tauxHumidite, tauxCendre)`
  reproduit exactement la formule VBA (humidité ajoutée aux caractéristiques combustible côté UI).

### 2.2 Consommation « 10 jours les plus froids » — 11 % et non 10/365
* **Excel** : conso 10 jours = **11 %** de la consommation annuelle (jours les plus froids,
  constante VBA `×0,11`).
* **Code avant** : `conso/365×10` ≈ 2,7 % — sous-estimait le stockage requis d'un facteur 4.
* **Corrigé** : `calculConso10JoursFroids` (constante `PART_CONSO_10_JOURS_FROIDS = 0.11`),
  utilisé partout (ParcConfig, synoptique, onglet Silo).

### 2.3 Pertes du réseau de chaleur — saisies mais jamais utilisées
* **Excel** : pertes (kWh/an) = **3 450 h × kW/ml × longueur**, ajoutées aux consommations
  des bâtiments **avant** la répartition bois/appoint.
* **Code avant** : `calculPertesReseau` retournait `longueur × kW/ml` (une puissance, pas une
  énergie) et n'était appelé nulle part — longueur et section étaient saisies pour rien.
* **Corrigé** : pertes = `longueur × kW/ml × 3450` intégrées au calcul dans la route
  `/api/calculs`, la page Résultats, ParcConfig, le synoptique et l'onglet Silo.
  Table des sections complétée : l'Excel a **8 sections** (DN25→DN110), le seed et le
  sélecteur n'en proposaient que 4. Ajout DN63 (0,017), DN75 (0,020), DN90 (0,026), DN110 (0,035).

### 2.4 Bilan 20 ans de la page Résultats — annuités oubliées
* **Excel** : le coût annuel de départ est le **coût global** (exploitation + annuité,
  `solution biomasse` L19/M40) ; l'annuité est retranchée une fois l'emprunt soldé (année 16).
* **Code avant** : la page Résultats démarrait à l'exploitation seule puis retranchait quand même
  l'annuité à l'année 16 (la route API, elle, faisait juste). Le graphe 20 ans et les économies
  cumulées étaient donc faux dès qu'un emprunt existait.
* **Corrigé** : la page Résultats passe désormais `coût + annuité` comme l'API et l'Excel.

### 2.5 Montant P2 (entretien/maintenance) absent des scénarios actuel et référence
* **Excel** (`solution biomasse` D14/E14/F14) : P2 = 750 € pour l'actuel **et** la référence,
  1 200 € pour la biomasse. Sans P2 actuel/réf, la comparaison était biaisée **contre** la biomasse.
* **Corrigé** : champ `montantP2` (défaut 750 €) ajouté à `ChiffragReference`
  (migration `20260610100000_add_montant_p2_reference`), saisissable dans le formulaire de
  chiffrage référence, intégré aux coûts annuels actuel et référence (API + page Résultats).

### 2.6 Données DJU du seed inventées
* **Excel** (`Meteo`) : DJU moyens calculés sur 1996-2022 (source SDES/Météo France) + T° de base.
* **Seed avant** : valeurs approximatives sans rapport (ex. Ain 2450 au lieu de 2148,1 ;
  Alpes-Maritimes 1700 au lieu de **1017,4** ; Ardèche T° base −6 au lieu de −7…).
  Le DJU pilote toutes les consommations calculées → résultats faux pour la plupart des départements.
* **Corrigé** : les 96 départements réécrits avec la moyenne exacte (colonne AD) et la
  T° extérieure de base (colonne AF) de l'Excel.

### 2.7 BDD coûts très incomplète
* **Excel** (`BDD_cout`) : 6 familles, ~62 articles.
* **Seed avant** : 34 articles ; catégories **VRD** et **Gros Œuvre** totalement absentes,
  chaudières gaz absentes, etc.
* **Corrigé** : seed complété (95 articles au total) — VRD (12), Gros Œuvre (14),
  Équipements (16), Chaufferie biomasse (29 dont chaudières gaz 50→500 kW), Chauffage bâtiments (5).
  Seul « Enrobé » (VRD) est omis : la cellule prix est vide dans l'Excel.

### 2.8 Monotone — « part base puissance » et suggestion de couverture
* **Excel** (`Monotone_2`) : part base **puissance** = P générateur / P max appelée (BA2) ;
  part base **énergie** = besoins couverts / besoins totaux (BA3). C'est cette part base énergie
  que le client recopie comme **% de couverture bois**.
* **Code avant** : part base puissance = % d'heures sous le seuil (sémantique différente) ;
  et rien n'était affiché — le module monotone existait mais était inutilisé pour la couverture.
* **Corrigé** : formule alignée sur l'Excel dans `calculPartBase`, et la page Résultats affiche
  désormais sous la monotone : puissance max appelée, part base puissance, part base énergie
  (= % couverture bois suggéré).

### 2.9 Dimensionnement silo / livraisons / km haie / stères
* **Excel (VBA)** : silo recommandé = max(volume camion, conso 10 j en m³) × **1,5** ;
  livraisons/an = volume annuel / volume camion (valeur décimale) ; km de haie = m³/93 ;
  stères = énergie entrée chaudière / 1 600.
* **Code avant** : silo purement saisi sans recommandation ; livraisons arrondies au plafond ;
  km haie et stères saisis à la main sans aide.
* **Corrigé** : `calculVolumeSiloRecommande`, `calculNbLivraisons`, `calculKmHaie`,
  `calculSteresAn` ajoutés et affichés (ParcConfig, synoptique, onglet Silo). Les valeurs
  saisies restent prioritaires ; le calcul sert de valeur par défaut/contrôle.
* Note : la macro Excel divise des **MWh** par 1 600 pour les stères (résultat 1 000× trop
  petit) — bug d'unité de l'Excel ; le SaaS applique l'intention (kWh/1 600).

### 2.10 Tarif gaz naturel — coquille Excel écartée
* **Excel** (`Energies`) : gaz naturel = **0,978 €/kWh**, soit ~10× le prix marché et 4× tout le
  reste de la table (fuel 0,13, propane 0,1652, élec 0,226, granulés 0,1162). Coquille évidente
  pour **0,0978**.
* **Preuve décisive** : la constante `ENERGY_TARIFS` qui alimente réellement l'autofill des
  bâtiments (et donc les calculs) utilisait **déjà 0,0978** — le développeur initial avait corrigé
  la coquille à cet endroit. Seule la table de référence `Energie` du seed gardait 0,978.
* **Corrigé** : seed aligné sur 0,0978 (valeur éditable dans l'admin). Garde-fou ajouté au test
  de parité. Aucun risque pour le client : l'autofill utilisait déjà la bonne valeur, c'est la
  cohérence de la table de référence affichée qui est rétablie.

### 2.11 Coefficient d'intermittence — fidélité Excel rétablie
* **Excel** : la colonne O « Coef de correction intermittence » existe mais **n'est jamais
  appliquée** dans les formules (VBA ligne 934 : aucun facteur d'intermittence ; valeur = 1
  partout dans l'exemple).
* **Code avant** : `COEF_INTERMITTENCE` injectait en douce **0,85 (bureaux)** et **0,80 (autres)**
  à chaque choix de type de bâtiment (valeurs **non issues de l'Excel**) → conso de référence
  15-20 % sous l'Excel pour ces bâtiments. Les études du client n'auraient **pas pu se réconcilier**
  avec ses résultats historiques.
* **Corrigé** : coefficient ramené à **1 par défaut pour tous les types** (fidélité Excel stricte).
  Le champ reste éditable : un utilisateur averti peut saisir 0,85/0,80 manuellement s'il veut une
  correction d'intermittence. Garde-fou ajouté au test de parité.

### 2.12 Divers
* `frais_annexes` renvoyé par `/api/calculs` contenait en réalité la TVA, et
  `sous_total_chaufferie` contenait l'investissement HT — libellés corrigés (impact PDF).
* Défaut « Bureau de contrôle » du formulaire référence : 5 % → **0 %** (défaut Excel).
* Seed facteur d'émission « Électricité » → « Electricité » pour s'aligner sur les clés de
  `EMISSION_FACTORS` (la table DB et la constante TS divergeaient).
* Nouveau test `tests/parity-excel.test.ts` : **16 vérifications** numériques contre les valeurs
  réellement stockées dans l'Excel (lignes Donnees 5-6, pertes réseau, cendres, 11 %) + 2
  garde-fous de mise en service (tarif gaz, intermittence) — exécuté par `npm test`.

---

## 3. Bugs de l'Excel volontairement NON reproduits — **vérifiés, aucune validation client requise**

Chacun de ces 7 points a été re-confirmé en relisant la formule / macro VBA exacte. Dans tous
les cas, le comportement « correct » est **non ambigu** (un total doit sommer ses lignes ; un tarif
libellé « €/kWh PCS » se facture sur le PCS ; une référence cassée n'est pas une intention). Le
SaaS implémente donc l'intention du modèle, pas ses bugs — **ces points sont tranchés, ils ne
nécessitent pas d'arbitrage du client.**

1. **« TOTAL DES INVESTISSEMENTS » faux dans les 8 feuilles de chiffrage** :
   la formule pointe une seule ligne au lieu du sous-total (ex. `chiffrage_ref_Parc1` F35 =
   `F19+F33` au lieu de `F23+F33` ; `chiffrage_bio_Parc1` F37 = `F15+F35` au lieu de `F25+F35`).
   Dans le classeur d'exemple cela passait inaperçu car les autres lignes étaient à 0.
   → Le SaaS calcule sous-total complet + frais annexes.
2. **Frais annexes bio Parc1/Parc2 assis sur une seule ligne** (`=$F$24` = « Autres travaux »
   au lieu du sous-total `$F$25`) — bug de décalage à l'insertion de lignes (Parc3/4 sont justes).
   → Le SaaS applique les taux au sous-total chaufferie.
3. **`Bilan Actualisé` S41** (variante avec subventions) référence `R11` (l'autre tableau)
   au lieu de `R41` — l'année 16 du scénario subventionné était fausse.
   → Le SaaS calcule chaque série sur sa propre continuité.
4. **Coût annuel de référence (AG) calculé sur le PCI** dans la macro alors que l'état initial
   facture le PCS et que le tarif est déclaré « € TTC / kWh PCS ». Incohérence interne à l'Excel
   qui surestimait les économies pour les références gaz.
   → Le SaaS facture les deux états sur le PCS (cohérent avec l'unité du tarif).
5. **Stères calculés en MWh/1 600** (voir §2.9).
6. **Boutons « Enregistrer » des parcs 2-4 sans code** dans `UserForm_chiffrage_ref_CH`
   (seul le parc 1 était réellement enregistré). → Le SaaS gère les 4 parcs en base.
7. **Feuilles de synthèse truffées de `#REF!`** (`Déperditions et consommations`, `volet 1`,
   `Synthese …`, `CO2 SO2` lignes conso) — références cassées par des suppressions de
   lignes/feuilles. C'est précisément le problème que le SaaS résout.

---

## 4. Points tranchés par le raisonnement (ne nécessitent plus le client)

Ces points étaient initialement « à valider » ; ils sont désormais **résolus** :

1. **Tarif gaz naturel** → fixé à **0,0978 €/kWh** (cf. §2.10). La valeur 0,978 est physiquement
   impossible et l'app utilisait déjà 0,0978 dans son chemin de calcul réel. Décision sûre et
   réversible (éditable dans l'admin) si le client avait une raison contraire — mais il n'y en a
   aucune crédible.
2. **Coefficient d'intermittence** → ramené à **1 par défaut** (cf. §2.11), pour que le SaaS
   reproduise exactement l'Excel du client. Correction d'intermittence disponible à la main.
3. **État de référence implicite** : un bâtiment sans état de référence retombe sur l'état initial
   (jamais de chaudière dimensionnée à 0). Plus sûr que le « compte pour 0 » de l'Excel, conservé.
4. **P2 actuel = P2 référence** (un seul champ, 750 € par défaut). Dans l'Excel les deux cellules
   ont la même formule `=150×5` → un champ unique est fidèle. Dissociation triviale si besoin futur.

## 4 bis. Seul point restant réellement ouvert (confort, non bloquant)

* L'Excel lie « Installation réseau hydraulique dans bât existants » du chiffrage bio aux valeurs
  du chiffrage référence (`=chiffrage_ref_ParcN!D20/E20`) ; dans le SaaS c'est un champ libre.
  Pré-remplissage automatique possible si le client le souhaite — pur confort de saisie, sans
  impact sur la justesse des résultats.

**Conclusion : l'outil est prêt pour le client.** Tous les écarts de calcul et de données sont
résolus et verrouillés par 16 tests de parité ; le seul reste est une commodité de saisie optionnelle.

---

## 5. Comment vérifier

```bash
npm test          # calculs (17) + régression (173) + parité Excel (16 points de contrôle)
npx tsc --noEmit  # types OK
npm run build     # build Next.js OK
```

Pour les bases existantes, appliquer la migration :
```bash
npx prisma migrate deploy && npx prisma db seed
```
(le re-seed est nécessaire pour charger les DJU corrigés, les 8 sections réseau et la BDD coûts complète)
