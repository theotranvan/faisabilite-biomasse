/**
 * Calculation functions for 20-year balance sheet (bilan actualisé)
 * Includes energy cost evolution and CO2/SO2 emissions tracking
 */

import { BilanActualize, AnnualCost } from './types';

/**
 * CO2 and SO2 emission factors per fuel type (kg/kWh)
 */
export const EMISSION_FACTORS = {
  Plaquette: { co2: 0.013, so2: 0.00025 },
  Granulé: { co2: 0.027, so2: 0.00024 },
  Fuel: { co2: 0.314, so2: 0.00074 },
  'Gaz naturel': { co2: 0.243, so2: 0.00070 },
  'Gaz propane': { co2: 0.270, so2: 0.00150 },
  Electricité: { co2: 0.210, so2: 0.00086 },
};

/**
 * 1 TEP = 12602 kWh constant
 */
export const TEP_TO_KWH = 12602;

/**
 * Calculate total savings over 20 years
 */
export function calculTotalEconomies20ans(annees: AnnualCost[]): number {
  return annees.reduce((sum, year) => sum + year.economie, 0);
}

/**
 * Calculate CO2 emissions for a given consumption and fuel type
 * emissionCO2_tonnes = consommation_kWh × facteurCO2_kgParKwh / 1000
 */
export function calculCO2Emissions(
  consommation_kWh: number,
  facteurCO2_kgPerKwh: number
): number {
  return (consommation_kWh * facteurCO2_kgPerKwh) / 1000;
}

/**
 * Calculate SO2 emissions for a given consumption and fuel type
 */
export function calculSO2Emissions(
  consommation_kWh: number,
  facteurSO2_kgPerKwh: number
): number {
  return (consommation_kWh * facteurSO2_kgPerKwh) / 1000;
}

/**
 * Get emission factor for a fuel type
 */
export function getEmissionFactor(
  fuelType: string,
  type: 'co2' | 'so2'
): number {
  const factors = EMISSION_FACTORS[fuelType as keyof typeof EMISSION_FACTORS];
  if (!factors) return 0;
  return factors[type];
}

/**
 * Calculate CO2 evolution over 20 years
 */
export function calculCO2Evolution(
  consoInitiale: number,
  consoRef: number,
  consoBiomasse: number,
  fuelTypeInitial: string,
  fuelTypeRef: string,
  fuelTypeBiomasse: string,
  tauxAugmentationfossile: number,
  tauxAugmentationBiomasse: number
): Array<{ year: number; co2Initial: number; co2Ref: number; co2Biomasse: number }> {
  const co2Factors = {
    initial: getEmissionFactor(fuelTypeInitial, 'co2'),
    ref: getEmissionFactor(fuelTypeRef, 'co2'),
    biomasse: getEmissionFactor(fuelTypeBiomasse, 'co2'),
  };

  const evolution = [];

  for (let year = 1; year <= 20; year++) {
    const consoInitialYear = consoInitiale * Math.pow(1 + tauxAugmentationfossile, year - 1);
    const consoRefYear = consoRef * Math.pow(1 + tauxAugmentationfossile, year - 1);
    const consoBiomasseYear = consoBiomasse * Math.pow(1 + tauxAugmentationBiomasse, year - 1);

    evolution.push({
      year,
      co2Initial: calculCO2Emissions(consoInitialYear, co2Factors.initial),
      co2Ref: calculCO2Emissions(consoRefYear, co2Factors.ref),
      co2Biomasse: calculCO2Emissions(consoBiomasseYear, co2Factors.biomasse),
    });
  }

  return evolution;
}

/**
 * Calculate SO2 evolution over 20 years
 */
export function calculSO2Evolution(
  consoInitiale: number,
  consoRef: number,
  consoBiomasse: number,
  fuelTypeInitial: string,
  fuelTypeRef: string,
  fuelTypeBiomasse: string,
  tauxAugmentationfossile: number,
  tauxAugmentationBiomasse: number
): Array<{ year: number; so2Initial: number; so2Ref: number; so2Biomasse: number }> {
  const so2Factors = {
    initial: getEmissionFactor(fuelTypeInitial, 'so2'),
    ref: getEmissionFactor(fuelTypeRef, 'so2'),
    biomasse: getEmissionFactor(fuelTypeBiomasse, 'so2'),
  };

  const evolution = [];

  for (let year = 1; year <= 20; year++) {
    const consoInitialYear = consoInitiale * Math.pow(1 + tauxAugmentationfossile, year - 1);
    const consoRefYear = consoRef * Math.pow(1 + tauxAugmentationfossile, year - 1);
    const consoBiomasseYear = consoBiomasse * Math.pow(1 + tauxAugmentationBiomasse, year - 1);

    evolution.push({
      year,
      so2Initial: calculSO2Emissions(consoInitialYear, so2Factors.initial),
      so2Ref: calculSO2Emissions(consoRefYear, so2Factors.ref),
      so2Biomasse: calculSO2Emissions(consoBiomasseYear, so2Factors.biomasse),
    });
  }

  return evolution;
}

/**
 * Complete 20-year balance sheet calculation
 */
export function calculBilanComplet(
  coutInitialActuel: number,
  coutInitialRef: number,
  coutInitialBiomasse: number,
  consoInitiale: number,
  consoRef: number,
  consoBiomasse: number,
  fuelTypeInitial: string,
  fuelTypeRef: string,
  fuelTypeBiomasse: string,
  tauxAugmentationfossile: number,
  tauxAugmentationBiomasse: number,
  annuiteRef: number,
  annuiteBiomasse: number,
  dureeEmprunt: number = 15
): BilanActualize {
  const annees = calculBilan20Ans(
    coutInitialActuel,
    coutInitialRef,
    coutInitialBiomasse,
    tauxAugmentationfossile,
    tauxAugmentationBiomasse,
    annuiteRef,
    annuiteBiomasse,
    dureeEmprunt
  );

  const totalEconomies20ans = calculTotalEconomies20ans(annees);

  const co2Evolution = calculCO2Evolution(
    consoInitiale,
    consoRef,
    consoBiomasse,
    fuelTypeInitial,
    fuelTypeRef,
    fuelTypeBiomasse,
    tauxAugmentationfossile,
    tauxAugmentationBiomasse
  );

  const so2Evolution = calculSO2Evolution(
    consoInitiale,
    consoRef,
    consoBiomasse,
    fuelTypeInitial,
    fuelTypeRef,
    fuelTypeBiomasse,
    tauxAugmentationfossile,
    tauxAugmentationBiomasse
  );

  return {
    annees,
    totalEconomies20ans,
    co2Evolution,
    so2Evolution,
  };
}
