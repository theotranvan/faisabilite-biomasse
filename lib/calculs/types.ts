/**
 * Types and interfaces for calculation modules
 */

export interface EtatEnergie {
  deperditions_kW: number;
  rendementProduction: number; // pourcentage
  rendementDistribution: number;
  rendementEmission: number;
  rendementRegulation: number;
  coefIntermittence?: number;
  consommationsCalculees: number;
  consommationsReelles?: number;
  typeEnergie: string;
  tarification: number;
  abonnement: number;
}

export interface Batiment {
  numero: number;
  designation: string;
  typeBatiment: string;
  surfaceChauffee: number;
  volumeChauffe: number;
  parc: number;
  etatInitial: EtatEnergie;
  etatReference?: EtatEnergie | null;
}

export interface ChiffrageItem {
  designation: string;
  unite: string;
  qte: number;
  pu: number;
  total: number;
}

export interface FraisAnnexes {
  bureauControle: number;
  maitriseOeuvre: number;
  fraisDivers: number;
  aleas: number;
}

export interface ChiffrageParcRef {
  travauxChaufferie: ChiffrageItem[];
  isolation: Array<{ designation: string; total: number; dejaRealise: number }>;
  fraisAnnexes: FraisAnnexes;
  P2_ref?: number;
  emprunt_ref?: number;
}

export interface CalculsBatiment {
  // État initial
  rendementMoyenEI: number;
  consoKWhepEI: number;
  consoPCSEI: number;
  coutAnnuelEI: number;

  // État de référence
  rendementMoyenRef?: number;
  consoRefCalculees?: number;
  consoRefPCS?: number;
  consoSortieChaudieresRef?: number;
  coutAnnuelRef?: number;
  prixKWhRef?: number;
}

export interface CalculsParc {
  puissanceChauffage: number; // kW
  consoBatiments: number; // kWh/an
  investissementHTRef?: number;
  investissementTTCRef?: number;
  annuiteRef?: number;
}

export interface MonotoneDataPoint {
  heure: number;
  temperature: number;
  puissance: number; // W
}

export interface CalculsMonotone {
  deperditionsParDegre: number;
  monotonePoints: MonotoneDataPoint[];
  monotoneTriee: MonotoneDataPoint[];
  puissanceMax: number;
  partBasePuissance: number; // percentage
  partBaseEnergie: number;
  besoinsGenerateurBase: number;
  besoinsTotaux: number;
}

export interface AnnualCost {
  year: number;
  coutActuel: number;
  coutRef: number;
  coutBiomasse: number;
  economie: number;
}

export interface BilanActualize {
  annees: AnnualCost[];
  totalEconomies20ans: number;
  co2Evolution: Array<{ year: number; co2Initial: number; co2Ref: number; co2Biomasse: number }>;
  so2Evolution: Array<{ year: number; so2Initial: number; so2Ref: number; so2Biomasse: number }>;
}
