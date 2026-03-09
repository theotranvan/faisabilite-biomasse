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
 */
export function calculsBatimentReference(
  batiment: Batiment
): Partial<CalculsBatiment> {
  if (!batiment.etatReference) {
    return {};
  }

  const etatRef = batiment.etatReference;
  const rendementMoyenRef = calculRendementMoyenRef(etatRef);
  
  return {
    rendementMoyenRef,
    consoRefCalculees: 0,
    consoRefPCS: 0,
    consoSortieChaudieresRef: 0,
    coutAnnuelRef: 0,
  };
}

/**
 * Complete calculation for a building (both initial and reference states)
 */
export function calculsBatimentComplet(
  batiment: Batiment
): CalculsBatiment {
  const calcEI = calculsBatimentInitial(batiment);
  const calcRef = calculsBatimentReference(batiment);

  return {
    ...calcEI,
    ...calcRef,
  } as CalculsBatiment;
}
