// Types d'entités — typés d'après le schéma Prisma

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  entreprise?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Affaire {
  id: string;
  userId: string;
  referenceAffaire: string;
  nomClient: string;
  adresse?: string | null;
  ville: string;
  departement: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  tempExtBase: number;
  tempIntBase: number;
  djuRetenu: number;
  augmentationFossile: number;
  augmentationBiomasse: number;
  tauxEmprunt: number;
  dureeEmprunt: number;
  villeMonotone?: string | null;
  tarifFuelExploitation?: number | null;
  tarifGazExploitation?: number | null;
  tarifBoisExploitation?: number | null;
  tarifElecExploitation?: number | null;
  statut: string;
  createdAt: string;
  updatedAt: string;
  batiments?: Batiment[];
  parcs?: Parc[];
}

export interface Batiment {
  id: string;
  affaireId: string;
  numero: number;
  designation: string;
  typeBatiment: string;
  surfaceChauffee: number;
  volumeChauffe: number;
  parc: number;
  deperditions: number;
  rendementProduction: number;
  rendementDistribution: number;
  rendementEmission: number;
  rendementRegulation: number;
  coefIntermittence: number;
  consommationsCalculees?: number | null;
  consommationsReelles?: number | null;
  typeEnergie: string;
  tarification: number;
  abonnement: number;
  refDeperditions?: number | null;
  refTypeEnergie?: string | null;
  refRendementProduction?: number | null;
  refRendementDistribution?: number | null;
  refRendementEmission?: number | null;
  refRendementRegulation?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Parc {
  id: string;
  affaireId: string;
  numero: number;
  puissanceChaudiereBois?: number | null;
  rendementChaudiereBois?: number | null;
  puissanceChaudiere2?: number | null;
  rendementChaudiere2?: number | null;
  typeBiomasse?: string | null;
  longueurReseau?: number | null;
  sectionReseau?: string | null;
  pourcentageCouvertureBois?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ChiffragReference = {
  id: string;
  parcId: string;
  travauxChaufferie: string; // JSON
  isolation: string; // JSON
  fraisAnnexes: string; // JSON
  P2_ref?: number | null;
  emprunt_ref?: number | null;
}

export type ChiffrageBiomasse = {
  id: string;
  parcId: string;
  vrd?: number | null;
  grosOeuvre?: number | null;
  charpente?: number | null;
  processBois?: number | null;
  chaudierAppoint?: number | null;
  hydraulique?: number | null;
  reseauChaleur?: number | null;
  sousStation?: number | null;
  installationReseauBat?: number | null;
  autreTravaux?: number | null;
  bureauControle?: number | null;
  maitriseOeuvre?: number | null;
  fraisDivers?: number | null;
  aleas?: number | null;
  cotEnr?: number | null;
  aideDepartementale?: number | null;
  detrDsil?: number | null;
  subventionComplementaire?: number | null;
  p2?: number | null;
  consoElecSupplement?: number | null;
  emprunt_biomasse?: number | null;
}

export type UserWithAffaires = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  affaires: Affaire[];
};

export type AffaireWithRelations = {
  id: string;
  referenceAffaire: string;
  nomClient: string;
  batiments: Batiment[];
  parcs: Parc[];
};

// Calculation types
export interface CalculsBatiment {
  rendementMoyen: number;
  consommationsCalculees: number;
  consommationsEP: number;
  consommationsPCS: number;
  coutAnnuel: number;
}

export interface CalculsParc {
  puissanceChauffageParc: number;
  consommationsBatimentsParc: number;
  pertesReseau: number;
  consommationsSortieChaudiereBois: number;
  consommationsEntreeChaudiereBois: number;
  consommationsSortieChaudiereAppoint: number;
  consommationsEntreeChaudiereAppoint: number;
  stockage10jours: {
    tonnes: number;
    m3: number;
  };
  volumeCendres: {
    m3: number;
    kg: number;
  };
  heuresPP: number;
}

export interface BilanEconomique {
  coutActuelAnnuel: number;
  coutRefAnnuel: number;
  coutBiomasseAnnuel: number;
  gainExploitation: number;
  tempsRetour: number;
}

export interface BilanAnnee {
  annee: number;
  coutActuel: number;
  coutRef: number;
  coutBiomasse: number;
  economieBioVsRef: number;
  economieBioVsActuel: number;
  cumulEconomies: number;
}

export interface EmissionsGES {
  co2Annuel: number; // tonnes/an
  so2Annuel: number; // tonnes/an
  tep: number;
}

export interface CostLineItem {
  designation: string;
  unite: string;
  qte: number;
  prixUnitaire: number;
  dejaRealise?: number;
}

export interface CostLineItemChiffrage {
  designation: string;
  unite: string;
  qte: number;
  prixUnitaire: number;
}
