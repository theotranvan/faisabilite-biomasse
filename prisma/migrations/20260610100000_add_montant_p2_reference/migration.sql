-- P2 entretien/maintenance pour les scénarios actuel et référence (750 € par défaut, comme l'Excel)
ALTER TABLE "chiffrage_reference" ADD COLUMN "montantP2" DOUBLE PRECISION NOT NULL DEFAULT 750;
