/**
 * Calculs pour le chiffrage (coûts)
 */

import { CostLineItem, CostLineItemChiffrage } from '@/types';

export interface ChiffrageSummary {
  sousTotal: number;
  dejaRealise: number;
  resteARealiser: number;
}

export interface ChiffrageTotal {
  sousTotal: number;
  fraisAnnexes: number;
  totalHT: number;
  tva: number; // 20%
  totalTTC: number;
}

export function calculChiffrageLignes(lignes: CostLineItem[]): number {
  return lignes.reduce((total, ligne) => {
    return total + ligne.qte * ligne.prixUnitaire;
  }, 0);
}

export function calculChiffrageIsolation(
  lignesIsolation: CostLineItem[]
): ChiffrageSummary {
  const sousTotal = calculChiffrageLignes(lignesIsolation);
  const dejaRealise = lignesIsolation.reduce(
    (total, ligne) => total + (ligne.dejaRealise || 0),
    0
  );
  return {
    sousTotal,
    dejaRealise,
    resteARealiser: sousTotal - dejaRealise,
  };
}

export function calculChiffrageChaufferie(
  lignesChaufferie: CostLineItemChiffrage[]
): number {
  return calculChiffrageLignes(lignesChaufferie as CostLineItem[]);
}

export function calculFraisAnnexes(
  sousTotal: number,
  tauxBureauControle: number,
  tauxMaitriseOeuvre: number,
  tauxFraisDivers: number,
  tauxAleas: number
): number {
  const tauxTotal = tauxBureauControle + tauxMaitriseOeuvre + tauxFraisDivers + tauxAleas;
  return sousTotal * tauxTotal;
}

export function calculChiffrageTotal(
  sousTotal: number,
  tauxBureauControle: number,
  tauxMaitriseOeuvre: number,
  tauxFraisDivers: number,
  tauxAleas: number
): ChiffrageTotal {
  const fraisAnnexes = calculFraisAnnexes(
    sousTotal,
    tauxBureauControle,
    tauxMaitriseOeuvre,
    tauxFraisDivers,
    tauxAleas
  );
  const totalHT = sousTotal + fraisAnnexes;
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  return {
    sousTotal,
    fraisAnnexes,
    totalHT,
    tva,
    totalTTC,
  };
}

/**
 * Subventions
 */
export interface SubventionsTotal {
  cotEnr: number;
  aideDepartementale: number;
  detr: number;
  subventionCompl: number;
  total: number;
  montantCharged: number; // = totalHT - subventions
}

export function calculSubventions(
  totalHT: number,
  tauxCotEnr?: number,
  tauxAideDept?: number,
  tauxDetr?: number,
  tauxSubvCompl?: number
): SubventionsTotal {
  const cotEnr = totalHT * (tauxCotEnr || 0);
  const aideDepartementale = totalHT * (tauxAideDept || 0);
  const detr = totalHT * (tauxDetr || 0);
  const subventionCompl = totalHT * (tauxSubvCompl || 0);
  const total = cotEnr + aideDepartementale + detr + subventionCompl;

  return {
    cotEnr,
    aideDepartementale,
    detr,
    subventionCompl,
    total,
    montantCharged: totalHT - total,
  };
}

/**
 * Financement (emprunt)
 */
export function calculAnnuiteEmprunt(
  montant: number,
  tauxEmprunt: number,
  dureeAnnees: number
): number {
  // Simplified: linear amortization + interest
  // Annuité = (montant / durée) + (montant × taux)
  return montant / dureeAnnees + montant * tauxEmprunt;
}

/**
 * Comparaison coûts exploitation
 */
export interface CoutsExploitation {
  coutCombustible: number;
  coutAbonnement: number;
  coutEntretien: number;
  total: number;
}

export function calculCoutsExploitationAnnuel(
  consommationPCS: number,
  tarification: number,
  abonnement: number,
  coutEntretien: number
): number {
  return consommationPCS * tarification + abonnement + coutEntretien;
}

export function calculCoutsExploitationBiomasse(
  consommationsEntreeBois: number,
  tarifBois: number,
  consommationsEntreeAppoint: number,
  tarifAppoint: number,
  consoElecSupplementaire: number,
  coutEntretien: number
): number {
  return (
    consommationsEntreeBois * tarifBois +
    consommationsEntreeAppoint * tarifAppoint +
    consoElecSupplementaire +
    coutEntretien
  );
}
