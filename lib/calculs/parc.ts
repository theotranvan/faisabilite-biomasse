/**
 * Calculation functions for park/site aggregation
 * Sums building data by park (SUMIF operations)
 */

import { Batiment, CalculsParc, ChiffrageParcRef, FraisAnnexes } from './types';
// Note: calculations are done inline in calculConsoSortieParcChaudieresRef
// with rendement detection logic

/**
 * Calculate park power (heating power) = sum of reference deperditions for buildings in that park
 * Only counts buildings that have a reference state defined
 */
export function calculPuissanceChauffageParc(
  batiments: Batiment[],
  parcNumber: number
): number {
  return batiments
    .filter(b => b.parc === parcNumber && b.etatReference)
    .reduce((sum, b) => {
      return sum + (b.etatReference?.deperditions_kW || 0);
    }, 0);
}

/**
 * Calculate total boiler outlet consumption for park buildings
 * consoSortieChaudieres sum for all buildings in the park
 */
export function calculConsoSortieParcChaudieresRef(
  batiments: Batiment[],
  parcNumber: number,
  DJU: number,
  tempInt: number,
  tempExt: number
): number {
  return batiments
    .filter(b => b.parc === parcNumber && b.etatReference)
    .reduce((sum, b) => {
      const etatRef = b.etatReference!;
      
      // Detect if rendements are in % or decimal format
      const rp = etatRef.rendementProduction > 1 ? etatRef.rendementProduction / 100 : etatRef.rendementProduction;
      const rd = etatRef.rendementDistribution > 1 ? etatRef.rendementDistribution / 100 : etatRef.rendementDistribution;
      const re = etatRef.rendementEmission > 1 ? etatRef.rendementEmission / 100 : etatRef.rendementEmission;
      const rr = etatRef.rendementRegulation > 1 ? etatRef.rendementRegulation / 100 : etatRef.rendementRegulation;
      
      const rendementMoyenRef = rp * rd * re * rr;
      
      // Calculate consumption leaving boiler
      const consoRefCalculees = 
        (etatRef.deperditions_kW * 1000 * DJU * 24) /
        ((tempInt - tempExt) * rendementMoyenRef * 1000) *
        (b.etatInitial.coefIntermittence || 1);
      
      const consoSortie = consoRefCalculees * rp; // rendement production en décimal
      return sum + consoSortie;
    }, 0);
}

/**
 * Calculate total investment HT for a park reference scenario
 * sousTotalChaufferie + fraisAnnexes (isolation is "for information only" - NOT included)
 */
export function calculInvestissementHTRef(
  travauxChaufferie: Array<{ qte: number; pu: number }>,
  fraisAnnexes: FraisAnnexes
): number {
  // Sous-total chaufferie SEULE
  const sousTotalChaufferie = travauxChaufferie.reduce((sum, item) => {
    return sum + (item.qte * item.pu);
  }, 0);

  // Frais annexes calculés SUR CHAUFFERIE uniquement (PAS sur isolation)
  const totalFeeRates = 
    (fraisAnnexes.bureauControle || 0) +
    (fraisAnnexes.maitriseOeuvre || 0) +
    (fraisAnnexes.fraisDivers || 0) +
    (fraisAnnexes.aleas || 0);

  const fees = sousTotalChaufferie * totalFeeRates;

  return sousTotalChaufferie + fees;
}

/**
 * Calculate investment TTC for a park reference scenario
 * totalInvestissementHT × (1 + 0.20 TVA)
 */
export function calculInvestissementTTCRef(investissementHT: number): number {
  return investissementHT * 1.2; // 20% VAT
}

/**
 * Calculate annual annuity for a park reference scenario
 * annuite = (investissementHT + emprunt) / dureeEmprunt
 */
export function calculAnnuiteRef(
  investissementHT: number,
  emprunt: number | undefined,
  dureeEmprunt: number
): number {
  const montantTotal = investissementHT + (emprunt || 0);
  return montantTotal / dureeEmprunt;
}

// ============ BIOMASS CALCULATION FUNCTIONS ============

/**
 * Calculate boiler outlet consumption for biomass
 */
export function calculConsommationsSortieChaudiereBois(
  consommationsBatimentsParc: number,
  pourcentageCouvertureBois: number
): number {
  return (consommationsBatimentsParc * pourcentageCouvertureBois) / 100;
}

/**
 * Calculate boiler inlet consumption for biomass
 */
export function calculConsommationsEntreeChaudiereBois(
  consommationsSortieChaudiereBois: number,
  rendementChaudiereBois: number
): number {
  return consommationsSortieChaudiereBois / (rendementChaudiereBois / 100);
}

/**
 * Calculate backup boiler consumption
 */
export function calculConsommationsAppoint(
  consommationsBatimentsParc: number,
  pourcentageCouvertureBois: number,
  rendementChaudiere2: number
): number {
  const sortie =
    (consommationsBatimentsParc * (100 - pourcentageCouvertureBois)) / 100;
  return sortie / (rendementChaudiere2 / 100);
}

/**
 * Calculate 10-day storage requirements
 */
export function calculStockage10jours(
  consommation10joursKwh: number,
  pci: number,
  masseVolumique: number
): { tonnes: number; m3: number } {
  const tonnes = consommation10joursKwh / (pci * 1000);
  const m3 = (tonnes * 1000) / masseVolumique;
  return { tonnes, m3 };
}

/**
 * Calculate ash volume
 */
export function calculVolumeCendres(
  consommationsEntreeChaudiereBois: number,
  tauxCendre: number,
  masseVolumique: number
): { m3: number; kg: number } {
  const m3 = (consommationsEntreeChaudiereBois * tauxCendre) / masseVolumique;
  const kg = m3 * masseVolumique;
  return { m3, kg };
}

/**
 * Calculate full-power hours
 */
export function calculHeuresPP(
  consommationsSortieChaudiereBois: number,
  puissanceChaudiereBois: number
): number {
  return consommationsSortieChaudiereBois / puissanceChaudiereBois;
}

/**
 * Calculate network losses
 */
export function calculPertesReseau(
  longueurReseau: number,
  pertesKwPerMl: number
): number {
  return longueurReseau * pertesKwPerMl;
}

/**
 * Complete aggregated calculations for a park
 */
export function calculsParcComplet(
  batiments: Batiment[],
  parcNumber: number,
  chiffrage: ChiffrageParcRef,
  dureeEmprunt: number,
  DJU: number,
  tempInt: number,
  tempExt: number
): CalculsParc {
  const puissanceChauffage = calculPuissanceChauffageParc(
    batiments,
    parcNumber
  );

  const consoBatiments = calculConsoSortieParcChaudieresRef(
    batiments,
    parcNumber,
    DJU,
    tempInt,
    tempExt
  );

  const investissementHT = calculInvestissementHTRef(
    chiffrage.travauxChaufferie,
    chiffrage.fraisAnnexes
  );

  const investissementTTC = calculInvestissementTTCRef(investissementHT);
  const annuite = calculAnnuiteRef(investissementHT, chiffrage.emprunt_ref, dureeEmprunt);

  return {
    puissanceChauffage,
    consoBatiments,
    investissementHTRef: investissementHT,
    investissementTTCRef: investissementTTC,
    annuiteRef: annuite,
  };
}
