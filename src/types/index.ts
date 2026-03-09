// Types d'entités (importées de Prisma au besoin)
export type User = any;
export type Affaire = any;
export type Batiment = any;
export type Parc = any;
export type ChiffragReference = any;
export type ChiffrageBiomasse = any;

export type UserWithAffaires = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  affaires: any[];
};

export type AffaireWithRelations = {
  id: string;
  referenceAffaire: string;
  nomClient: string;
  batiments: any[];
  parcs: any[];
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
