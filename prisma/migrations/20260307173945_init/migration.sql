-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "entreprise" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "affaires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "villeMonotone" TEXT NOT NULL,
    "tempExtBase" REAL NOT NULL DEFAULT -7,
    "tempIntBase" REAL NOT NULL DEFAULT 19,
    "djuRetenu" REAL NOT NULL,
    "augmentationFossile" REAL NOT NULL DEFAULT 0.04,
    "augmentationBiomasse" REAL NOT NULL DEFAULT 0.02,
    "tauxEmprunt" REAL NOT NULL DEFAULT 0.02,
    "dureeEmprunt" INTEGER NOT NULL DEFAULT 15,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "affaires_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historique_affaires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affaireId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historique_affaires_affaireId_fkey" FOREIGN KEY ("affaireId") REFERENCES "affaires" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batiments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affaireId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "typeBatiment" TEXT NOT NULL,
    "surfaceChauffee" REAL NOT NULL,
    "volumeChauffe" REAL NOT NULL,
    "parc" INTEGER NOT NULL,
    "deperditions" REAL NOT NULL,
    "rendementProduction" REAL NOT NULL,
    "rendementDistribution" REAL NOT NULL,
    "rendementEmission" REAL NOT NULL,
    "rendementRegulation" REAL NOT NULL,
    "coefIntermittence" REAL NOT NULL DEFAULT 1,
    "consommationsCalculees" REAL,
    "consommationsReelles" REAL,
    "typeEnergie" TEXT NOT NULL,
    "tarification" REAL NOT NULL,
    "abonnement" REAL NOT NULL,
    "refDeperditions" REAL,
    "refTypeEnergie" TEXT,
    "refRendementProduction" REAL,
    "refRendementDistribution" REAL,
    "refRendementEmission" REAL,
    "refRendementRegulation" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "batiments_affaireId_fkey" FOREIGN KEY ("affaireId") REFERENCES "affaires" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parcs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affaireId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "puissanceChaudiereBois" REAL,
    "rendementChaudiereBois" REAL,
    "puissanceChaudiere2" REAL,
    "rendementChaudiere2" REAL,
    "typeBiomasse" TEXT,
    "longueurReseau" REAL,
    "sectionReseau" TEXT,
    "pourcentageCouvertureBois" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parcs_affaireId_fkey" FOREIGN KEY ("affaireId") REFERENCES "affaires" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chiffrage_reference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcId" TEXT NOT NULL,
    "lignesIsolation" TEXT NOT NULL,
    "lignesChaufferie" TEXT NOT NULL,
    "tauxBureauControle" REAL NOT NULL DEFAULT 0,
    "tauxMaitriseOeuvre" REAL NOT NULL DEFAULT 0.13,
    "tauxFraisDivers" REAL NOT NULL DEFAULT 0.02,
    "tauxAleas" REAL NOT NULL DEFAULT 0.05,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chiffrage_reference_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parcs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chiffrage_biomasse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcId" TEXT NOT NULL,
    "vrd" REAL,
    "grosOeuvre" REAL,
    "charpenteCouverture" REAL,
    "processBois" REAL,
    "chaudiereAppoint" REAL,
    "hydrauliqueChaufferie" REAL,
    "reseauChaleurQte" REAL,
    "reseauChaleurPU" REAL,
    "sousStation" REAL,
    "installationReseau" REAL,
    "autresTravaux" REAL,
    "tauxBureauControle" REAL NOT NULL DEFAULT 0.03,
    "tauxMaitriseOeuvre" REAL NOT NULL DEFAULT 0.09,
    "tauxFraisDivers" REAL NOT NULL DEFAULT 0.02,
    "tauxAleas" REAL NOT NULL DEFAULT 0.05,
    "tauxSubventionCotEnr" REAL,
    "tauxAideDepartementale" REAL,
    "tauxDetrDsil" REAL,
    "subventionComplementaire" REAL,
    "montantP2" REAL NOT NULL DEFAULT 1200,
    "consoElecSupplementaire" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chiffrage_biomasse_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parcs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "energies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "abonnement" REAL NOT NULL,
    "tarification" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "caracteristiques_biomasse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "pci" REAL NOT NULL,
    "masseVolumique" REAL NOT NULL,
    "tauxHumidite" REAL NOT NULL,
    "tauxCendre" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "facteurs_emission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "combustible" TEXT NOT NULL,
    "co2PerKwh" REAL NOT NULL,
    "so2PerKwh" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bdd_couts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categorie" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "meteo_moyenne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departement" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "djuMoyenne" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "meteo_monotone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ville" TEXT NOT NULL,
    "heure" INTEGER NOT NULL,
    "temperatureExt" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pertes_reseau" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "pertesKwPerMl" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "affaires_userId_reference_key" ON "affaires"("userId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "batiments_affaireId_numero_key" ON "batiments"("affaireId", "numero");

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
CREATE UNIQUE INDEX "meteo_monotone_ville_heure_key" ON "meteo_monotone"("ville", "heure");

-- CreateIndex
CREATE UNIQUE INDEX "pertes_reseau_section_key" ON "pertes_reseau"("section");
