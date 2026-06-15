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

      // Garde division par zéro (cohérent avec calculConsoRefCalculees) :
      // ΔT nul (Tint = Text) ou rendement moyen nul → contribution nulle plutôt
      // qu'Infinity/NaN qui se propagerait dans les coûts et le bilan.
      const deltaT = tempInt - tempExt;
      if (deltaT <= 0 || rendementMoyenRef <= 0) {
        return sum;
      }

      // Calculate consumption leaving boiler
      const consoRefCalculees =
        (etatRef.deperditions_kW * 1000 * DJU * 24) /
        (deltaT * rendementMoyenRef * 1000) *
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
  if (!dureeEmprunt || dureeEmprunt <= 0) return montantTotal; // garde : durée nulle → pas de division
  return montantTotal / dureeEmprunt;
}

// ============ BIOMASS CALCULATION FUNCTIONS ============

/**
 * Pertes réseau par section (kW/ml) — table Excel "Utile" (Reseau_Ch)
 */
export const PERTES_RESEAU_KW_PER_ML: Record<string, number> = {
  DN25: 0.007,
  DN32: 0.009,
  DN40: 0.010,
  DN50: 0.012,
  DN63: 0.017,
  DN75: 0.020,
  DN90: 0.026,
  DN110: 0.035,
};

/**
 * Heures équivalentes de fonctionnement du réseau retenues par l'Excel
 * (VBA UserForm_saisie_biomasse : pertes = 3450 × kW/ml × ml)
 */
export const HEURES_RESEAU_AN = 3450;

/**
 * Part de la consommation annuelle représentée par les 10 jours les plus froids
 * (VBA : conso 10 jours = 11 % du volume annuel)
 */
export const PART_CONSO_10_JOURS_FROIDS = 0.11;

/** Masse volumique des cendres retenue par l'Excel (kg/m³) */
export const MASSE_VOLUMIQUE_CENDRES = 600;

/** 1 km de haie ≈ 93 m³ de plaquettes (constante Excel) */
export const M3_PLAQUETTES_PAR_KM_HAIE = 93;

/** 1 stère ≈ 1600 kWh (constante Excel, corrigée en kWh) */
export const KWH_PAR_STERE = 1600;

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
  if (!rendementChaudiereBois || rendementChaudiereBois <= 0) return 0; // garde : rendement nul
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
  if (!rendementChaudiere2 || rendementChaudiere2 <= 0) return 0; // garde : rendement appoint nul
  return sortie / (rendementChaudiere2 / 100);
}

/**
 * Consommation des 10 jours les plus froids = 11 % de la consommation annuelle
 * (formule Excel : TextBox24 = volume annuel × 0,11)
 */
export function calculConso10JoursFroids(consommationAnnuelleKwh: number): number {
  return consommationAnnuelleKwh * PART_CONSO_10_JOURS_FROIDS;
}

/**
 * Volume annuel de bois (tonnes et m³) à partir de l'énergie entrée chaudière
 * pci en MWh/t, masse volumique en kg/m³
 */
export function calculVolumeAnnuelBois(
  consommationsEntreeChaudiereBoisKwh: number,
  pci: number,
  masseVolumique: number
): { tonnes: number; m3: number } {
  const tonnes = consommationsEntreeChaudiereBoisKwh / (pci * 1000);
  const m3 = masseVolumique > 0 ? (tonnes * 1000) / masseVolumique : 0;
  return { tonnes, m3 };
}

/**
 * Calculate 10-day storage requirements
 */
export function calculStockage10jours(
  consommation10joursKwh: number,
  pci: number,
  masseVolumique: number
): { tonnes: number; m3: number } {
  return calculVolumeAnnuelBois(consommation10joursKwh, pci, masseVolumique);
}

/**
 * Volume de cendres — formule Excel (VBA UserForm_saisie_biomasse) :
 * cendres (kg) = masse sèche de bois (kg) × taux de cendres
 *              = (conso entrée / PCI) × (1 − taux humidité) × 1000 × taux cendres
 * cendres (m³) = kg / 600 (masse volumique des cendres)
 *
 * tauxHumidite et tauxCendre en décimal (0.25 = 25 %)
 */
export function calculVolumeCendres(
  consommationsEntreeChaudiereBoisKwh: number,
  pci: number,
  tauxHumidite: number,
  tauxCendre: number
): { m3: number; kg: number } {
  const tonnesBois = consommationsEntreeChaudiereBoisKwh / (pci * 1000);
  const kg = tonnesBois * (1 - tauxHumidite) * 1000 * tauxCendre;
  const m3 = kg / MASSE_VOLUMIQUE_CENDRES;
  return { m3, kg };
}

/**
 * Calculate full-power hours
 */
export function calculHeuresPP(
  consommationsSortieChaudiereBois: number,
  puissanceChaudiereBois: number
): number {
  if (!puissanceChaudiereBois || puissanceChaudiereBois <= 0) return 0; // garde : puissance nulle
  return consommationsSortieChaudiereBois / puissanceChaudiereBois;
}

/**
 * Pertes annuelles du réseau de chaleur (kWh/an) — formule Excel :
 * pertes = 3450 h × (kW/ml × longueur)
 */
export function calculPertesReseau(
  longueurReseau: number,
  pertesKwPerMl: number
): number {
  return longueurReseau * pertesKwPerMl * HEURES_RESEAU_AN;
}

/**
 * Pertes annuelles du réseau (kWh/an) à partir de la section (DN25…DN110)
 */
export function calculPertesReseauParSection(
  longueurReseau: number,
  section: string | null | undefined
): number {
  if (!longueurReseau || !section) return 0;
  const kwPerMl = PERTES_RESEAU_KW_PER_ML[section] || 0;
  return calculPertesReseau(longueurReseau, kwPerMl);
}

/**
 * Consommation totale à produire = consommations bâtiments + pertes réseau
 * (l'Excel additionne les pertes avant de répartir bois/appoint)
 */
export function calculConsoTotaleAvecPertes(
  consommationsBatimentsParc: number,
  longueurReseau?: number | null,
  section?: string | null
): number {
  return consommationsBatimentsParc + calculPertesReseauParSection(longueurReseau || 0, section);
}

/**
 * Nombre de livraisons par an = volume annuel (m³) / volume camion (m³)
 */
export function calculNbLivraisons(volumeAnnuelM3: number, volumeCamion: number): number {
  if (!volumeCamion) return 0;
  return volumeAnnuelM3 / volumeCamion;
}

/**
 * Volume de silo recommandé — formule Excel :
 * max(volume camion, conso 10 jours en m³) × (1 + 20 % + 30 %)
 */
export function calculVolumeSiloRecommande(
  volumeCamion: number,
  conso10joursM3: number,
  margeManutention = 0.2,
  margeSecurite = 0.3
): number {
  return Math.max(volumeCamion || 0, conso10joursM3 || 0) * (1 + margeManutention + margeSecurite);
}

/**
 * Km de haie équivalents par an = volume annuel (m³) / 93
 */
export function calculKmHaie(volumeAnnuelM3: number): number {
  return volumeAnnuelM3 / M3_PLAQUETTES_PAR_KM_HAIE;
}

/**
 * Stères par an = consommation entrée chaudière (kWh) / 1600
 * (l'Excel divisait des MWh par 1600 — erreur d'unité corrigée ici)
 */
export function calculSteresAn(consommationsEntreeChaudiereBoisKwh: number): number {
  return consommationsEntreeChaudiereBoisKwh / KWH_PAR_STERE;
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
