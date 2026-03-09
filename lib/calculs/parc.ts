/**
 * Calculation functions for park/site aggregation
 * Sums building data by park (SUMIF operations)
 */

import { Batiment, CalculsParc, ChiffrageParcRef, FraisAnnexes } from './types';
import { calculConsoSortieChaudieresRef, calculRendementMoyenRef } from './batiment';

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
      const rendementMoyenRef = calculRendementMoyenRef(etatRef);
      
      // Calculate consumption leaving boiler
      const consoRefCalculees = 
        (etatRef.deperditions_kW * 1000 * DJU * 24) /
        ((tempInt - tempExt) * rendementMoyenRef * 1000) *
        (b.etatInitial.coefIntermittence || 1);
      
      const consoSortie = calculConsoSortieChaudieresRef(consoRefCalculees, etatRef.rendementProduction);
      return sum + consoSortie;
    }, 0);
}

/**
 * Calculate total investment HT for a park reference scenario
 * sousTotalChaufferie + fraisAnnexes
 */
export function calculInvestissementHTRef(
  travauxChaufferie: Array<{ qte: number; pu: number }>,
  isolation: Array<{ dejaRealise: number; total: number }>,
  fraisAnnexes: FraisAnnexes
): number {
  // Sum chaufferie work
  const sousTotalChaufferie = travauxChaufferie.reduce((sum, item) => {
    return sum + (item.qte * item.pu);
  }, 0);

  // Sum isolation work (only non-already-done parts)
  const sousTotalIsolation = isolation.reduce((sum, item) => {
    return sum + Math.max(0, item.total - item.dejaRealise);
  }, 0);

  const totalBeforeFees = sousTotalChaufferie + sousTotalIsolation;

  // Calculate fees
  const totalFeeRates = 
    (fraisAnnexes.bureauControle || 0) +
    (fraisAnnexes.maitriseOeuvre || 0) +
    (fraisAnnexes.fraisDivers || 0) +
    (fraisAnnexes.aleas || 0);

  const fees = totalBeforeFees * totalFeeRates;

  return totalBeforeFees + fees;
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
    chiffrage.isolation,
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
