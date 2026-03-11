/**
 * Calculation functions for building energy analysis
 * Implements the Excel formulas for biomass feasibility studies
 */

import { EtatEnergie, Batiment, CalculsBatiment } from './types';

/**
 * Calculate average efficiency = (rendProd/100) × (rendDistrib/100) × (rendEmission/100) × (rendRegul/100)
 */
export function calculRendementMoyen(etat: EtatEnergie): number {
  const rp = etat.rendementProduction / 100;
  const rd = etat.rendementDistribution / 100;
  const re = etat.rendementEmission / 100;
  const rr = etat.rendementRegulation / 100;
  return rp * rd * re * rr;
}

/**
 * Calculate consumption in kWhep (primary energy)
 * SI typeEnergie == "Electricité" → consoReelles × 2.3
 * SINON → consoReelles (ou consoCalculees si pas de réelles)
 */
export function calculConsoKWhep(etat: EtatEnergie): number {
  const conso = etat.consommationsReelles || etat.consommationsCalculees;
  
  if (etat.typeEnergie === 'Electricité' || etat.typeEnergie === 'Electricity') {
    return conso * 2.3;
  }
  return conso;
}

/**
 * Calculate PCS consumption (Primary Calorific Value)
 * SI typeEnergie IN ("Gaz naturel", "Gaz propane") → consoCalculees × 1.1
 * SINON → consoCalculees
 */
export function calculConsoPCS(etat: EtatEnergie): number {
  if (etat.typeEnergie === 'Gaz naturel' || etat.typeEnergie === 'Gaz propane' || 
      etat.typeEnergie === 'Natural gas' || etat.typeEnergie === 'Propane') {
    return etat.consommationsCalculees * 1.1;
  }
  return etat.consommationsCalculees;
}

/**
 * Calculate annual cost
 * coutAnnuel = abonnement + (consoPCS × tarification)
 */
export function calculCoutAnnuel(etat: EtatEnergie): number {
  const consoPCS = calculConsoPCS(etat);
  return etat.abonnement + (consoPCS * etat.tarification);
}

/**
 * Calculate average efficiency for reference state
 */
export function calculRendementMoyenRef(etat: EtatEnergie): number {
  if (!etat.rendementProduction || !etat.rendementDistribution || 
      !etat.rendementEmission || !etat.rendementRegulation) {
    return 0;
  }
  const rp = etat.rendementProduction / 100;
  const rd = etat.rendementDistribution / 100;
  const re = etat.rendementEmission / 100;
  const rr = etat.rendementRegulation / 100;
  return rp * rd * re * rr;
}

/**
 * Calculate reference state consumption (kWh/an)
 * consoRefCalculees = deperditionsRef × 1000 × DJU × 24 / ((Tint - Text) × rendMoyenRef × 1000) × coefIntermittence
 */
export function calculConsoRefCalculees(
  deperditions_kW: number,
  DJU: number,
  tempInt: number,
  tempExt: number,
  rendementMoyenRef: number,
  coefIntermittence: number = 1
): number {
  const deltaT = tempInt - tempExt;
  if (deltaT <= 0 || rendementMoyenRef <= 0) return 0;
  
  const numerator = deperditions_kW * 1000 * DJU * 24;
  const denominator = deltaT * rendementMoyenRef * 1000;
  
  return (numerator / denominator) * coefIntermittence;
}

/**
 * Calculate PCS consumption for reference state
 * consoRefPCS = SI refEnergie IN ("Gaz nat","Gaz propane") → consoRefCalculees × 1.1 SINON consoRefCalculees
 */
export function calculConsoRefPCS(consoRefCalculees: number, energyType: string): number {
  if (energyType === 'Gaz naturel' || energyType === 'Gaz propane' || 
      energyType === 'Natural gas' || energyType === 'Propane') {
    return consoRefCalculees * 1.1;
  }
  return consoRefCalculees;
}

/**
 * Calculate boiler outlet consumption (consumption leaving the boiler)
 * consoSortieChaudieres = consoRefCalculees × rendProdRef
 */
export function calculConsoSortieChaudieresRef(
  consoRefCalculees: number,
  rendementProduction: number
): number {
  return consoRefCalculees * rendementProduction;
}

/**
 * Calculate annual cost for reference state
 */
export function calculCoutAnnuelRef(
  consoRefPCS: number,
  tarification: number,
  abonnement: number = 0
): number {
  return abonnement + (consoRefPCS * tarification);
}

/**
 * Complete calculation for a building initial state
 */
export function calculsBatimentInitial(batiment: Batiment): CalculsBatiment {
  const etat = batiment.etatInitial;
  
  return {
    rendementMoyenEI: calculRendementMoyen(etat),
    consoKWhepEI: calculConsoKWhep(etat),
    consoPCSEI: calculConsoPCS(etat),
    coutAnnuelEI: calculCoutAnnuel(etat),
  };
}

/**
 * Complete calculation for a building reference state
 * Now takes DJU, tempInt, tempExt parameters needed for accurate calculations
 */
export function calculsBatimentReference(
  batiment: Batiment,
  DJU: number,
  tempInt: number,
  tempExt: number
): Partial<CalculsBatiment> {
  if (!batiment.etatReference) {
    return {};
  }

  const etatRef = batiment.etatReference;
  
  // ATTENTION: dans l'Excel, les rendements ref sont en pourcentage (85, 90).
  // On divise par 100 comme pour l'état initial.
  const rp = etatRef.rendementProduction / 100;
  const rd = etatRef.rendementDistribution / 100;
  const re = etatRef.rendementEmission / 100;
  const rr = etatRef.rendementRegulation / 100;
  
  const rendementMoyenRef = rp * rd * re * rr;

  const consoRefCalculees = calculConsoRefCalculees(
    etatRef.deperditions_kW,
    DJU,
    tempInt,
    tempExt,
    rendementMoyenRef,
    batiment.etatInitial.coefIntermittence || 1
  );

  const consoRefPCS = calculConsoRefPCS(consoRefCalculees, etatRef.typeEnergie);
  const consoSortieChaudieresRef = calculConsoSortieChaudieresRef(consoRefCalculees, rp);
  const coutAnnuelRef = calculCoutAnnuelRef(consoRefPCS, etatRef.tarification, etatRef.abonnement);

  return {
    rendementMoyenRef,
    consoRefCalculees,
    consoRefPCS,
    consoSortieChaudieresRef,
    coutAnnuelRef,
  };
}

/**
 * Complete calculation for a building (both initial and reference states)
 */
export function calculsBatimentComplet(
  batiment: Batiment,
  DJU: number = 1977,
  tempInt: number = 19,
  tempExt: number = -7
): CalculsBatiment {
  const calcEI = calculsBatimentInitial(batiment);
  const calcRef = calculsBatimentReference(batiment, DJU, tempInt, tempExt);

  return {
    ...calcEI,
    ...calcRef,
  } as CalculsBatiment;
}

/**
 * Étiquette énergétique (DPE-like) based on kWhep/m²/an
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
    A: '#10b981',
    B: '#84cc16',
    C: '#eab308',
    D: '#f97316',
    E: '#ef4444',
    F: '#dc2626',
    G: '#7f1d1d',
  };
  return colors[letter] || '#6b7280';
}
