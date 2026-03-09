/**
 * Calculs pour un bâtiment individuel
 */

import { CalculsBatiment } from '@/types';

export function calculRendementMoyen(
  rendementProduction: number,
  rendementDistribution: number,
  rendementEmission: number,
  rendementRegulation: number
): number {
  const rp = rendementProduction / 100;
  const rd = rendementDistribution / 100;
  const re = rendementEmission / 100;
  const rr = rendementRegulation / 100;
  return rp * rd * re * rr;
}

export function calculConsommationsCalculees(
  deperditions: number, // kW
  dju: number,
  tempIntBase: number,
  tempExtBase: number,
  rendementMoyen: number,
  coefIntermittence: number
): number {
  // Formula: deperditions × 1000 × DJU × 24 / ((tempIntBase - tempExtBase) × rendementMoyen × 1000) × coefIntermittence
  const numerateur = deperditions * 1000 * dju * 24 * coefIntermittence;
  const denominateur = (tempIntBase - tempExtBase) * rendementMoyen * 1000;
  return numerateur / denominateur;
}

export function calculConsommationsEP(
  consommationsReelles: number,
  typeEnergie: string
): number {
  // Si électricité: × 2.3 / sinon: × 1
  return typeEnergie === 'ELECTRICITE' ? consommationsReelles * 2.3 : consommationsReelles;
}

export function calculConsommationsPCS(
  consommationsCalculees: number,
  typeEnergie: string
): number {
  // Si gaz naturel ou propane: × 1.1 / sinon: × 1
  if (typeEnergie === 'GAZ_NATUREL' || typeEnergie === 'GAZ_PROPANE') {
    return consommationsCalculees * 1.1;
  }
  return consommationsCalculees;
}

export function calculCoutAnnuel(
  abonnement: number,
  consommationsPCS: number,
  tarification: number
): number {
  return abonnement + consommationsPCS * tarification;
}

export function calculBatiment(
  deperditions: number,
  rendementProduction: number,
  rendementDistribution: number,
  rendementEmission: number,
  rendementRegulation: number,
  dju: number,
  tempIntBase: number,
  tempExtBase: number,
  coefIntermittence: number,
  typeEnergie: string,
  tarification: number,
  abonnement: number,
  consommationsReellesOptional?: number
): CalculsBatiment {
  const rendementMoyen = calculRendementMoyen(
    rendementProduction,
    rendementDistribution,
    rendementEmission,
    rendementRegulation
  );

  let consommationsCalculees = calculConsommationsCalculees(
    deperditions,
    dju,
    tempIntBase,
    tempExtBase,
    rendementMoyen,
    coefIntermittence
  );

  // Use real consumption if provided, otherwise use calculated
  const consommationsReelles = consommationsReellesOptional || consommationsCalculees;

  const consommationsEP = calculConsommationsEP(consommationsReelles, typeEnergie);
  const consommationsPCS = calculConsommationsPCS(consommationsReelles, typeEnergie);
  const coutAnnuel = calculCoutAnnuel(abonnement, consommationsPCS, tarification);

  return {
    rendementMoyen,
    consommationsCalculees,
    consommationsEP,
    consommationsPCS,
    coutAnnuel,
  };
}

// Calcul état de référence
export function calculBatimentReference(
  refDeperditions: number,
  refRendementProduction: number,
  refRendementDistribution: number,
  refRendementEmission: number,
  refRendementRegulation: number,
  dju: number,
  tempIntBase: number,
  tempExtBase: number,
  refTypeEnergie: string
): {
  consommationsCalculees: number;
  consommationsPCS: number;
  consommationsSortieChaudiere: number;
  rendementMoyen: number;
} {
  const rendementMoyen = calculRendementMoyen(
    refRendementProduction,
    refRendementDistribution,
    refRendementEmission,
    refRendementRegulation
  );

  const consommationsCalculees = calculConsommationsCalculees(
    refDeperditions,
    dju,
    tempIntBase,
    tempExtBase,
    rendementMoyen,
    1 // pas de coefficient intermittence pour référence
  );

  const consommationsPCS = calculConsommationsPCS(consommationsCalculees, refTypeEnergie);
  const consommationsSortieChaudiere = consommationsCalculees * rendementMoyen;

  return {
    consommationsCalculees,
    consommationsPCS,
    consommationsSortieChaudiere,
    rendementMoyen,
  };
}

/**
 * Etiquette énergétique (DPE-like)
 */
export function calculEtiquetteEnergetique(consommationKwhepPerM2: number): string {
  if (consommationKwhepPerM2 <= 50) return 'A';
  if (consommationKwhepPerM2 <= 90) return 'B';
  if (consommationKwhepPerM2 <= 150) return 'C';
  if (consommationKwhepPerM2 <= 230) return 'D';
  if (consommationKwhepPerM2 <= 330) return 'E';
  if (consommationKwhepPerM2 <= 450) return 'F';
  return 'G';
}

export function getEtiquetteCouleur(letter: string): string {
  const colors: Record<string, string> = {
    A: '#10b981', // vert
    B: '#84cc16',
    C: '#eab308',
    D: '#f97316',
    E: '#ef4444',
    F: '#dc2626',
    G: '#7f1d1d',
  };
  return colors[letter] || '#6b7280';
}
