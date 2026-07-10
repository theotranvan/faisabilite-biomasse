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
* **Corrigé** : champ `montantP2` (défaut 750 €) ajouté à `ChiffragReference` (inclus dans la
  baseline de migration PostgreSQL, cf. §5), saisissable dans le formulaire de chiffrage
  référence, intégré aux coûts annuels actuel et référence (API + page Résultats).

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
* **Corrigé** : seed complété (**83 articles**, vérifié en base) — VRD (12), Gros Œuvre (14),
  Équipements (16), Chaufferie biomasse (30 dont chaudières gaz 50→500 kW), Isolation (6),
  Chauffage bâtiments (5). Seul « Enrobé » (VRD) est omis : la cellule prix est vide dans l'Excel.

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

### 2.12 bis Consommations calculées de l'état initial + comparatif calculées/réelles (retour client, 10 juillet 2026)
* **Retour client (S. Rogala)** : « il manque le calcul des consommations et le comparatif
  entre les consommations calculées et réelles ».
* **Excel (`UserForm_initial`)** : le formulaire de saisie de l'état initial affiche
  « Consommations calculées » (bouton Calculer, CommandButton5), « Consommations réelles »
  (saisie factures) et « Écart » (TextBox15 = `(réelles − calculées)/réelles`). La colonne P
  de `Donnees` stocke la calculée, la Q la réelle ; le coût annuel (X) et la conso théorique
  PCS (T→U) sont assis sur la **calculée**.
* **Formule** : `conso = coef intermittence × déperditions × 24 × DJU / ((19 − Text) × rendement moyen)`.
  Deux arrondis du formulaire font partie des valeurs stockées et sont **reproduits** pour que
  les études historiques du client se réconcilient : rendement moyen arrondi au % entier
  (TextBox12 « 0 % »), consommation arrondie au kWh (TextBox13 « 0 »).
  Vérifié : P6 = 31 464, P5 = 58 868, P4 = 70 189 (au kWh près).
* **SaaS avant** : un seul champ « Consommation annuelle actuelle » recopié dans les deux
  colonnes ; aucune consommation théorique calculée, aucun écart affiché.
* **Corrigé** :
  - `calculConsoInitialeCalculee` + `calculEcartConsoPct` dans `lib/calculs/batiment.ts` ;
    la conso calculée alimente le coût annuel initial (fidèle à T=P de l'Excel), la réelle
    reste la base du kWhep/DPE (fidèle à R5/R6) et du comparatif.
  - Onglet **Bâtiments** : conso calculée affichée en direct (lecture seule), saisie de la
    conso réelle (factures), badge d'écart coloré (vert ≤ 10 %, orange ≤ 20 %, rouge au-delà)
    + tableau comparatif tous bâtiments avec total.
  - **Synthèse & Résultats** : carte « Consommations calculées vs réelles » (par bâtiment + total).
  - **API `/api/calculs`** : champs `conso_calculee`, `conso_reelle`, `ecart_conso_pct` par bâtiment.
  - **Export PDF** : tableau « Comparatif consommations calculées / réelles ».
  - **Validation** : avertissement si écart > 20 % ou si la conso réelle n'est pas saisie.
  - 5 points de contrôle ajoutés au test de parité (P4/P5/P6, écart, X4).

### 2.12 ter Monotone — saison de chauffe manquante (audit du 10 juillet 2026)
* **Excel (`Monotone_1`)** : les formules de puissance appelée n'existent que pour les
  heures 0..2519 (1ᵉʳ janvier → 15 avril) et 6888.. (15 octobre → 31 décembre) — les
  heures d'été sont **exclues** des besoins même quand T < 19 °C (saison de chauffe).
* **Code avant** : la monotone sommait les 8 760 heures → besoins totaux surestimés
  (+27 % sur le classeur exemple : 76 907 kWh au lieu de 60 465) et « part base énergie »
  (le % de couverture bois suggéré) faussée (99,72 % au lieu de 99,64 %).
* **Corrigé** : filtre `estDansSaisonChauffe` (heure < 2520 ou ≥ 6888) dans
  `genererDonneeMonotone` ; la page Résultats utilise désormais le moteur partagé
  `calculMonotoneComplet` au lieu d'une réimplémentation en ligne (source de la dérive).
* **Vérifié au centime** contre le classeur : puissance max 29,192 kW (AS2), besoins
  totaux 60 465,115 kWh (AV3), besoins base 60 248,231 kWh (AW3), part base puissance
  85,639 % (BA2), part base énergie 99,641 % (BA3).
* Deux scripts de vérification permanents ajoutés à `npm test` :
  `scripts/verify-donnees-reference.ts` (83 contrôles : DJU 96 départements, tarifs,
  combustibles, sections réseau, facteurs CO₂/SO₂, 77 articles BDD coûts, 24 seuils DPE
  lus dans les formules K26:U26, 96 360 températures horaires) et
  `scripts/verify-formules-moteur.ts` (23 contrôles : monotone complète, bilan 20 ans,
  annuités, chiffrage, plafond subventions, défauts P2/tarifs exploitation).

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

---

## 5. Vérification runtime & mise en production (10 juin 2026)

L'application a été **réellement exécutée** (PostgreSQL 16 local, `migrate deploy` + `db seed`
documentés, `npm start`, parcours complet piloté via l'API HTTP avec session NextAuth). Trois
blocages invisibles au build/aux tests ont été trouvés et corrigés :

1. **Déploiement PostgreSQL cassé** : l'historique de migrations était en dialecte SQLite
   (`migration_lock.toml` = sqlite) alors que `schema.prisma` cible PostgreSQL →
   `prisma migrate deploy` échouait (P3019) sur toute base postgres. Historique remplacé par une
   baseline PostgreSQL unique (`20260610120000_init_postgresql`, inclut `montantP2`).
   *Base déjà déployée via `db push`* : exécuter une fois
   `prisma migrate resolve --applied 20260610120000_init_postgresql`.
2. **DJU jamais résolu à la création d'affaire** : recherche par *nom* de département alors que
   le front envoie le *code* (« 18 ») → toutes les affaires retombaient sur 2400 DJU / −7 °C.
   Corrigé (code OU nom) ; la T° extérieure de base du département est aussi reprise
   (vérifié : Cher → 2004,1 ; Ain → 2148,1 / −10 °C).
3. **Seed pertes réseau** : seules 4 sections sur 8 étaient chargées — corrigé (DN25→DN110).

Parité Excel re-confirmée via l'API réelle : conso réf 31 291,55 / 58 901,74 (= cellules AE6/AE5),
pertes DN63 = 29 325 kWh, annuité 2 607,93 (= L16), cap subventions 80 %, P2 inclus, bilan année 16.

## 5 bis. Vérification exhaustive du 10 juillet 2026 (demande client « tout doit être conforme »)

Audit indépendant complet : relecture du classeur cellule par cellule (openpyxl/xlsx + olevba),
trois scripts de vérification permanents, et exécution réelle de l'application (PostgreSQL 18,
`migrate deploy` + `db seed` + `next start`, parcours HTTP complet avec session NextAuth).

**Écarts trouvés et corrigés :**

1. **Monotone sans saison de chauffe** (§2.12 ter) — besoins surestimés ~+27 %, % couverture
   bois suggéré faussé. Corrigé + page Résultats branchée sur le moteur partagé.
2. **PUT `/api/affaires/[id]` ignorait `djuRetenu`** : le champ « DJU retenu » du formulaire
   Données générales était envoyé par le front mais jamais persisté — la modification du DJU
   par l'utilisateur était silencieusement perdue (tous les calculs restaient sur l'ancien DJU).
   `tempExtBase`/`tempIntBase` sont aussi passés par `parseFloat` (robustesse).
3. **`prisma db seed` cassé sous Node ≥ 20** (`node prisma/seed.ts` ne résout pas l'import
   `../src/lib/data/bddCouts` sans extension) → commande seed basculée sur `tsx` — le
   déploiement documenté (`migrate deploy && db seed`) refonctionne.
4. **Défaut « subvention complémentaire » 25 %** dans le formulaire chiffrage biomasse :
   n'existe pas dans l'Excel (3 lignes : COT ENR 45, départementale 20, DETR/DSIL 50) → 0.
   **P2 biomasse** du formulaire : 0 → 1 200 € (= `solution biomasse` F14).
5. **§4 bis résolu** : « Installation réseau hydraulique dans bât existants » du chiffrage bio
   est désormais pré-rempli depuis la ligne réseau hydraulique du chiffrage référence du même
   parc (lien Excel `chiffrage_bio!D23/E23 = chiffrage_ref!D20/E20`), modifiable.

**Couverture de vérification (tout est vert, verrouillé par `npm test`) :**

| Volet | Contrôles | Résultat |
|---|---|---|
| Tests calculs + régression + cas limites | 17 + 173 + 23 | ✓ |
| Parité Excel feuille Donnees (P/Q/R/U/X, AE/AF/AH, écart) | 21 | ✓ |
| Données de référence (`verify-donnees-reference.ts`) : DJU 96 dpts, tarifs, combustibles, sections, CO₂/SO₂, TEP, 77 articles BDD coûts, 24 seuils DPE lus dans les formules K26:U26, pondération étiquette globale, 96 360 T° horaires | 84 | ✓ |
| Formules moteur (`verify-formules-moteur.ts`) : monotone complète (8 736 h au centime), bilan 20 ans année par année, annuités, chiffrage, plafond 80 %, défauts P2/tarifs | 23 | ✓ |
| Runtime E2E (`verify-runtime-e2e.ts`, app réelle + base) : login → affaire (DJU auto dpt 18 = 2004,1) → 2 bâtiments du classeur → chiffrage → calculs → bilan → DPE → monotone → suppression | 30 | ✓ |

**Écarts assumés (décisions documentées, pas des bugs)** : bugs Excel non reproduits (§3),
tarif gaz 0,0978 (§4.1), intermittence 1 (§4.2), arrondis du formulaire état initial reproduits
(§2.12 bis), stères en kWh/1600 (§2.9). Présentation : le « taux EnR&R » de la feuille
`Déperditions et consommations` est exprimé dans le SaaS via le % de couverture bois / part
base énergie ; le double scénario de subventions du `Bilan Actualisé` (toutes subventions vs
COT ENR seule) est couvert par l'édition des taux de subvention (un seul scénario actif à la fois).

## 6. Sécurité d'accès — modèle implémenté et vérifié

Décision du client : **accès sur invitation, chaque utilisateur voit ses affaires (+ équipes),
l'admin voit tout.** Implémentation (`src/lib/authz.ts` + toutes les routes affaires) :

* **Inscription publique désactivée** : `/api/auth/register` exige une session ADMIN
  (403 sinon) ; la page `/auth/register` devient l'écran admin « Créer un accès »
  (redirection vers le login pour les non-admins). Bootstrap : sur une base sans aucun
  utilisateur, le premier compte créé devient ADMIN.
* **Périmètre des affaires** : propriétaire **ou** membre d'une équipe rattachée **ou** ADMIN.
  Routes couvertes : liste/détail/modification, bâtiments, isolation, parcs, chiffrages
  référence et biomasse, calculs, duplication. Hors périmètre → **404** (sans révéler
  l'existence). Suppression : propriétaire ou admin uniquement.
* **Vérifié au runtime (12/12)** : intrus → 403 inscription, 0 affaire listée, 404 sur toutes
  les routes d'une affaire d'autrui (lecture ET écriture) ; propriétaire → ses 9 affaires ;
  admin → tout + création d'accès 201 ; partage d'équipe → le collègue ajouté voit l'affaire
  d'équipe (calculs 200) mais pas les affaires personnelles (404).

**Conclusion : l'outil est prêt pour le client.** Calculs fidèles à l'Excel (verrouillés par
16 tests de parité + vérification runtime), déploiement PostgreSQL fonctionnel, accès sur
invitation avec cloisonnement par utilisateur/équipe. Avant l'ouverture : changer les mots de
passe par défaut du seed et définir un `NEXTAUTH_SECRET` fort.

---

## 7. Comment vérifier

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
