-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "entreprise" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affaires" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equipeId" TEXT,
    "referenceAffaire" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "tempExtBase" DOUBLE PRECISION NOT NULL DEFAULT -7,
    "tempIntBase" DOUBLE PRECISION NOT NULL DEFAULT 19,
    "djuRetenu" DOUBLE PRECISION NOT NULL,
    "augmentationFossile" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    "augmentationBiomasse" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "tauxEmprunt" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "dureeEmprunt" INTEGER NOT NULL DEFAULT 15,
    "villeMonotone" TEXT DEFAULT 'Bourges',
    "tarifFuelExploitation" DOUBLE PRECISION DEFAULT 0.10,
    "tarifGazExploitation" DOUBLE PRECISION DEFAULT 0.1502,
    "tarifBoisExploitation" DOUBLE PRECISION DEFAULT 0.05316,
    "tarifElecExploitation" DOUBLE PRECISION DEFAULT 0.1788,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_affaires" (
    "id" TEXT NOT NULL,
    "affaireId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_affaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batiments" (
    "id" TEXT NOT NULL,
    "affaireId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "typeBatiment" TEXT NOT NULL,
    "surfaceChauffee" DOUBLE PRECISION NOT NULL,
    "volumeChauffe" DOUBLE PRECISION NOT NULL,
    "parc" INTEGER NOT NULL,
    "deperditions" DOUBLE PRECISION NOT NULL,
    "rendementProduction" DOUBLE PRECISION NOT NULL,
    "rendementDistribution" DOUBLE PRECISION NOT NULL,
    "rendementEmission" DOUBLE PRECISION NOT NULL,
    "rendementRegulation" DOUBLE PRECISION NOT NULL,
    "coefIntermittence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "consommationsCalculees" DOUBLE PRECISION,
    "consommationsReelles" DOUBLE PRECISION,
    "typeEnergie" TEXT NOT NULL,
    "tarification" DOUBLE PRECISION NOT NULL,
    "abonnement" DOUBLE PRECISION NOT NULL,
    "refDeperditions" DOUBLE PRECISION,
    "refTypeEnergie" TEXT,
    "refRendementProduction" DOUBLE PRECISION,
    "refRendementDistribution" DOUBLE PRECISION,
    "refRendementEmission" DOUBLE PRECISION,
    "refRendementRegulation" DOUBLE PRECISION,
    "refTarification" DOUBLE PRECISION,
    "refAbonnement" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travaux_isolation" (
    "id" TEXT NOT NULL,
    "batimentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travaux_isolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travaux_isolation_lignes" (
    "id" TEXT NOT NULL,
    "travauxIsolationId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "dejaRealise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travaux_isolation_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcs" (
    "id" TEXT NOT NULL,
    "affaireId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "puissanceChaudiereBois" DOUBLE PRECISION,
    "rendementChaudiereBois" DOUBLE PRECISION,
    "puissanceChaudiere2" DOUBLE PRECISION,
    "rendementChaudiere2" DOUBLE PRECISION,
    "typeBiomasse" TEXT,
    "longueurReseau" DOUBLE PRECISION,
    "sectionReseau" TEXT,
    "pourcentageCouvertureBois" DOUBLE PRECISION,
    "volumeCamion" DOUBLE PRECISION DEFAULT 90,
    "volumeSilo" DOUBLE PRECISION,
    "kmHaieAn" DOUBLE PRECISION,
    "stereAn" DOUBLE PRECISION,
    "combustibleAppoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chiffrage_reference" (
    "id" TEXT NOT NULL,
    "parcId" TEXT NOT NULL,
    "lignesIsolation" TEXT NOT NULL,
    "lignesChaufferie" TEXT NOT NULL,
    "tauxBureauControle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tauxMaitriseOeuvre" DOUBLE PRECISION NOT NULL DEFAULT 0.13,
    "tauxFraisDivers" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "tauxAleas" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "montantP2" DOUBLE PRECISION NOT NULL DEFAULT 750,
    "empruntRef" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chiffrage_reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chiffrage_biomasse" (
    "id" TEXT NOT NULL,
    "parcId" TEXT NOT NULL,
    "vrd" DOUBLE PRECISION,
    "grosOeuvre" DOUBLE PRECISION,
    "charpenteCouverture" DOUBLE PRECISION,
    "processBois" DOUBLE PRECISION,
    "chaudiereAppoint" DOUBLE PRECISION,
    "hydrauliqueChaufferie" DOUBLE PRECISION,
    "reseauChaleurQte" DOUBLE PRECISION,
    "reseauChaleurPU" DOUBLE PRECISION,
    "sousStation" DOUBLE PRECISION,
    "installationReseau" DOUBLE PRECISION,
    "autresTravaux" DOUBLE PRECISION,
    "tauxBureauControle" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "tauxMaitriseOeuvre" DOUBLE PRECISION NOT NULL DEFAULT 0.09,
    "tauxFraisDivers" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "tauxAleas" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "tauxSubventionCotEnr" DOUBLE PRECISION,
    "tauxAideDepartementale" DOUBLE PRECISION,
    "tauxDetrDsil" DOUBLE PRECISION,
    "subventionComplementaire" DOUBLE PRECISION,
    "montantP2" DOUBLE PRECISION NOT NULL DEFAULT 1200,
    "consoElecSupplementaire" DOUBLE PRECISION,
    "empruntBio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chiffrage_biomasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energies" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "abonnement" DOUBLE PRECISION NOT NULL,
    "tarification" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracteristiques_biomasse" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pci" DOUBLE PRECISION NOT NULL,
    "masseVolumique" DOUBLE PRECISION NOT NULL,
    "tauxHumidite" DOUBLE PRECISION NOT NULL,
    "tauxCendre" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caracteristiques_biomasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facteurs_emission" (
    "id" TEXT NOT NULL,
    "combustible" TEXT NOT NULL,
    "co2PerKwh" DOUBLE PRECISION NOT NULL,
    "so2PerKwh" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facteurs_emission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bdd_couts" (
    "id" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bdd_couts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meteo_moyenne" (
    "id" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "djuMoyenne" DOUBLE PRECISION NOT NULL,
    "tempExtBase" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meteo_moyenne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meteo_dju_annuel" (
    "id" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "dju" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meteo_dju_annuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meteo_monotone" (
    "id" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "heure" INTEGER NOT NULL,
    "temperatureExt" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meteo_monotone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pertes_reseau" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "pertesKwPerMl" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pertes_reseau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EquipeMembres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "affaires_referenceAffaire_key" ON "affaires"("referenceAffaire");

-- CreateIndex
CREATE UNIQUE INDEX "affaires_userId_referenceAffaire_key" ON "affaires"("userId", "referenceAffaire");

-- CreateIndex
CREATE UNIQUE INDEX "batiments_affaireId_numero_key" ON "batiments"("affaireId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "travaux_isolation_batimentId_key" ON "travaux_isolation"("batimentId");

-- CreateIndex
CREATE UNIQUE INDEX "parcs_affaireId_numero_key" ON "parcs"("affaireId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "chiffrage_reference_parcId_key" ON "chiffrage_reference"("parcId");

-- CreateIndex
CREATE UNIQUE INDEX "chiffrage_biomasse_parcId_key" ON "chiffrage_biomasse"("parcId");

-- CreateIndex
CREATE UNIQUE INDEX "energies_nom_key" ON "energies"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "caracteristiques_biomasse_type_key" ON "caracteristiques_biomasse"("type");

-- CreateIndex
CREATE UNIQUE INDEX "facteurs_emission_combustible_key" ON "facteurs_emission"("combustible");

-- CreateIndex
CREATE UNIQUE INDEX "bdd_couts_categorie_designation_key" ON "bdd_couts"("categorie", "designation");

-- CreateIndex
CREATE UNIQUE INDEX "meteo_moyenne_departement_key" ON "meteo_moyenne"("departement");

-- CreateIndex
CREATE UNIQUE INDEX "meteo_dju_annuel_departement_annee_key" ON "meteo_dju_annuel"("departement", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "meteo_monotone_ville_heure_key" ON "meteo_monotone"("ville", "heure");

-- CreateIndex
CREATE UNIQUE INDEX "pertes_reseau_section_key" ON "pertes_reseau"("section");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipeMembres_AB_unique" ON "_EquipeMembres"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipeMembres_B_index" ON "_EquipeMembres"("B");

-- AddForeignKey
ALTER TABLE "affaires" ADD CONSTRAINT "affaires_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affaires" ADD CONSTRAINT "affaires_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_affaires" ADD CONSTRAINT "historique_affaires_affaireId_fkey" FOREIGN KEY ("affaireId") REFERENCES "affaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batiments" ADD CONSTRAINT "batiments_affaireId_fkey" FOREIGN KEY ("affaireId") REFERENCES "affaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travaux_isolation" ADD CONSTRAINT "travaux_isolation_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "batiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travaux_isolation_lignes" ADD CONSTRAINT "travaux_isolation_lignes_travauxIsolationId_fkey" FOREIGN KEY ("travauxIsolationId") REFERENCES "travaux_isolation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcs" ADD CONSTRAINT "parcs_affaireId_fkey" FOREIGN KEY ("affaireId") REFERENCES "affaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chiffrage_reference" ADD CONSTRAINT "chiffrage_reference_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chiffrage_biomasse" ADD CONSTRAINT "chiffrage_biomasse_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipeMembres" ADD CONSTRAINT "_EquipeMembres_A_fkey" FOREIGN KEY ("A") REFERENCES "equipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipeMembres" ADD CONSTRAINT "_EquipeMembres_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

