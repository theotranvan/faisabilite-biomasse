/**
 * Calculation functions for load curve (monotone de charge)
 * Analyzes heating demand over the year using hourly temperature data
 */

import { CalculsMonotone, MonotoneDataPoint } from './types';

/**
 * Calculate losses per degree Celsius
 * deperditionsParDegre = deperditionsTotales / (Tint - Text)  // W/°C
 */
export function calculDeperditionsParDegre(
  deperditionsTotales_W: number,
  tempIntBase: number,
  tempExtBase: number
): number {
  const deltaT = tempIntBase - tempExtBase;
  if (deltaT <= 0) return 0;
  return deperditionsTotales_W / deltaT;
}

/**
 * Calculate power called for a given temperature
 * puissanceAppelee = SI Temp < Tint → deperditionsParDegre × (Tint - Temp) SINON 0
 */
export function calculPuissanceAppeleePourTemp(
  deperditionsParDegre: number,
  tempInt: number,
  temp: number
): number {
  if (temp < tempInt) {
    return deperditionsParDegre * (tempInt - temp);
  }
  return 0;
}

/**
 * Saison de chauffe du classeur Excel (Monotone_1) : les formules de puissance
 * appelée n'existent que pour les heures 0..2519 (1er janvier → 15 avril) et
 * 6888.. (15 octobre → 31 décembre). Les heures d'été sont exclues des besoins
 * même si T < Tint — sans ce filtre les besoins totaux et la part base énergie
 * (% couverture bois suggéré) sont surestimés (~+27 % sur le classeur exemple).
 */
export const SAISON_CHAUFFE_FIN_H = 2520;   // 105 jours × 24 h → 15 avril
export const SAISON_CHAUFFE_DEBUT_H = 6888; // 287 jours × 24 h → 15 octobre

export function estDansSaisonChauffe(heure: number): boolean {
  return heure < SAISON_CHAUFFE_FIN_H || heure >= SAISON_CHAUFFE_DEBUT_H;
}

/**
 * Generate monotone data from weather data
 * Returns array of { heure, temperature, puissance }
 */
export function genererDonneeMonotone(
  temperatureParHeure: number[], // 8760 values for a year
  deperditionsParDegre: number,
  tempIntBase: number
): MonotoneDataPoint[] {
  return temperatureParHeure
    .map((temp, index) => ({
      heure: index,
      temperature: temp,
      puissance: calculPuissanceAppeleePourTemp(deperditionsParDegre, tempIntBase, temp),
    }))
    .filter(p => estDansSaisonChauffe(p.heure)) // Saison de chauffe Excel (15/10 → 15/04)
    .filter(p => p.puissance > 0); // Only include hours with heating demand
}

/**
 * Sort monotone data by power in descending order
 */
export function trierMonotone(monotoneData: MonotoneDataPoint[]): MonotoneDataPoint[] {
  return [...monotoneData].sort((a, b) => b.puissance - a.puissance);
}

/**
 * Calculate part of heating at base capacity (formules Excel Monotone_2)
 * partBasePuissance = puissance générateur / puissance max appelée (BA2 = AS3/AS2)
 * partBaseEnergie = besoins couverts par le générateur / besoins totaux (BA3 = AW3/AV3)
 */
export function calculPartBase(
  monotoneTriee: MonotoneDataPoint[],
  puissanceGenerateur: number
): { partBasePuissance: number; partBaseEnergie: number } {
  if (monotoneTriee.length === 0 || puissanceGenerateur <= 0) {
    return { partBasePuissance: 0, partBaseEnergie: 0 };
  }

  const puissanceMax = Math.max(...monotoneTriee.map(p => p.puissance));
  const partBasePuissance = puissanceMax > 0 ? (puissanceGenerateur / puissanceMax) * 100 : 0;

  // Calculate energy at base
  let energieBase = 0;
  let energieTotal = 0;

  monotoneTriee.forEach(p => {
    energieTotal += p.puissance; // Each datapoint represents 1 hour
    if (p.puissance <= puissanceGenerateur) {
      energieBase += p.puissance;
    } else {
      energieBase += puissanceGenerateur;
    }
  });

  const partBaseEnergie = energieTotal > 0 ? (energieBase / energieTotal) * 100 : 0;

  return { partBasePuissance, partBaseEnergie };
}

/**
 * Calculate total energy needs for base generator
 * besoinsGenerateurBase = sum of min(puissance, puissanceGenerateur) for all hours
 */
export function calculBesoinsGenerateurBase(
  monotoneData: MonotoneDataPoint[],
  puissanceGenerateur: number
): number {
  return monotoneData.reduce((sum, p) => {
    return sum + Math.min(p.puissance, puissanceGenerateur);
  }, 0);
}

/**
 * Calculate total energy needs
 */
export function calculBesoinsTotaux(monotoneData: MonotoneDataPoint[]): number {
  return monotoneData.reduce((sum, p) => sum + p.puissance, 0);
}

/**
 * Complete monotone calculation
 */
export function calculMonotoneComplet(
  temperatureParHeure: number[],
  deperditionsTotales_W: number,
  tempIntBase: number,
  tempExtBase: number,
  puissanceGenerateur_kW: number
): CalculsMonotone {
  const deperditionsParDegre = calculDeperditionsParDegre(
    deperditionsTotales_W,
    tempIntBase,
    tempExtBase
  );

  const monotonePoints = genererDonneeMonotone(
    temperatureParHeure,
    deperditionsParDegre,
    tempIntBase
  );

  const monotoneTriee = trierMonotone(monotonePoints);

  const puissanceGenerateur_W = puissanceGenerateur_kW * 1000;

  const { partBasePuissance, partBaseEnergie } = calculPartBase(
    monotoneTriee,
    puissanceGenerateur_W
  );

  const besoinsGenerateurBase = calculBesoinsGenerateurBase(monotonePoints, puissanceGenerateur_W);
  const besoinsTotaux = calculBesoinsTotaux(monotonePoints);

  // Convert from Wh to kWh
  return {
    deperditionsParDegre,
    monotonePoints,
    monotoneTriee,
    // Garde : Math.max() sur tableau vide renvoie -Infinity (ville sans données monotone)
    puissanceMax: monotonePoints.length ? Math.max(...monotonePoints.map(p => p.puissance)) / 1000 : 0, // Convert W to kW
    partBasePuissance,
    partBaseEnergie,
    besoinsGenerateurBase: besoinsGenerateurBase / 1000, // Convert Wh to kWh
    besoinsTotaux: besoinsTotaux / 1000, // Convert Wh to kWh
  };
}
