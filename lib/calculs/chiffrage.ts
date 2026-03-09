/**
 * Calculation functions for billing (chiffrage)
 * Implements investment calculation, VAT, amortization formulas
 */

import { ChiffrageParcRef, FraisAnnexes } from './types';

/**
 * Calculate subtotal for chaufferie work
 * sousTotalChaufferie = SOMME(qte × pu)
 */
export function calculSousTotalChaufferie(
  travauxChaufferie: Array<{ qte: number; pu: number }>
): number {
  return travauxChaufferie.reduce((sum, item) => sum + item.qte * item.pu, 0);
}

/**
 * Calculate subtotal for isolation work
 * Only counts work not already done (total - dejaRealise)
 */
export function calculSousTotalIsolation(
  isolation: Array<{ total: number; dejaRealise: number }>
): number {
  return isolation.reduce((sum, item) => {
    const remaining = Math.max(0, item.total - item.dejaRealise);
    return sum + remaining;
  }, 0);
}

/**
 * Calculate total fees/accessories
 * fraisAnnexes = sousTotalChaufferie × (bureauControle + maitriseOeuvre + fraisDivers + aleas)
 */
export function calculFraisAnnexes(
  sousTotalChaufferie: number,
  fraisAnnexesRates: FraisAnnexes
): number {
  const totalRates =
    (fraisAnnexesRates.bureauControle || 0) +
    (fraisAnnexesRates.maitriseOeuvre || 0) +
    (fraisAnnexesRates.fraisDivers || 0) +
    (fraisAnnexesRates.aleas || 0);

  return sousTotalChaufferie * totalRates;
}

/**
 * Calculate total investment HT (before tax)
 * totalInvestissementHT = sousTotalChaufferie + fraisAnnexes
 */
export function calculTotalInvestissementHT(
  sousTotalChaufferie: number,
  fraisAnnexes: number
): number {
  return sousTotalChaufferie + fraisAnnexes;
}

/**
 * Calculate VAT (20%)
 * TVA = totalInvestissementHT × 0.20
 */
export function calculTVA(totalInvestissementHT: number): number {
  return totalInvestissementHT * 0.2;
}

/**
 * Calculate total investment TTC (with tax)
 * totalTTC = totalInvestissementHT + TVA
 */
export function calculTotalInvestissementTTC(totalInvestissementHT: number): number {
  return totalInvestissementHT * 1.2;
}

/**
 * Calculate annual annuity (linear amortization)
 * annuite = (investissementHT + emprunt) / dureeEmprunt
 */
export function calculAnnuite(
  investissementHT: number,
  emprunt: number | undefined,
  dureeEmprunt: number
): number {
  const montantTotal = investissementHT + (emprunt || 0);
  return montantTotal / dureeEmprunt;
}

/**
 * Calculate all billing details for a project park
 */
export function calculChiffrageComplet(
  chiffrage: ChiffrageParcRef,
  dureeEmprunt: number
): {
  sousTotalChaufferie: number;
  sousTotalIsolation: number;
  fraisAnnexes: number;
  totalInvestissementHT: number;
  tva: number;
  totalInvestissementTTC: number;
  annuite: number;
} {
  const sousTotalChaufferie = calculSousTotalChaufferie(chiffrage.travauxChaufferie);
  const fraisAnnexes = calculFraisAnnexes(sousTotalChaufferie, chiffrage.fraisAnnexes);
  const totalInvestissementHT = calculTotalInvestissementHT(sousTotalChaufferie, fraisAnnexes);
  const tva = calculTVA(totalInvestissementHT);
  const totalInvestissementTTC = calculTotalInvestissementTTC(totalInvestissementHT);
  const annuite = calculAnnuite(totalInvestissementHT, chiffrage.emprunt_ref, dureeEmprunt);

  return {
    sousTotalChaufferie,
    sousTotalIsolation: calculSousTotalIsolation(chiffrage.isolation),
    fraisAnnexes,
    totalInvestissementHT,
    tva,
    totalInvestissementTTC,
    annuite,
  };
}
