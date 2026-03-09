/**
 * Bilan actualisé sur 20 ans
 */

export interface BilanAnnualBreakdown {
  annee: number;
  coutActuel: number;
  coutRef: number;
  coutBiomasse: number;
  economieBioVsRef: number;
  economieBioVsActuel: number;
  cumulEconomies: number;
}

export function calculBilan20ans(
  coutActuelAnnee1: number,
  coutRefAnnee1: number,
  coutBiomasseAnnee1: number,
  tauxAugmentationFossile: number,
  tauxAugmentationBiomasse: number,
  annuiteEmpruntRef: number,
  annuiteEmpruntBio: number,
  dureeEmprunt: number
): BilanAnnualBreakdown[] {
  const bilan: BilanAnnualBreakdown[] = [];
  let cumulEconomies = 0;

  for (let annee = 1; annee <= 20; annee++) {
    let coutActuel = coutActuelAnnee1 * Math.pow(1 + tauxAugmentationFossile, annee - 1);
    let coutRef = coutRefAnnee1 * Math.pow(1 + tauxAugmentationFossile, annee - 1);
    let coutBiomasse = coutBiomasseAnnee1 * Math.pow(1 + tauxAugmentationBiomasse, annee - 1);

    // At year 15 (end of loan), subtract annuity
    if (annee > dureeEmprunt) {
      coutRef -= annuiteEmpruntRef; // no more payments
      coutBiomasse -= annuiteEmpruntBio;
    }

    const economieBioVsRef = coutRef - coutBiomasse;
    const economieBioVsActuel = coutActuel - coutBiomasse;
    cumulEconomies += economieBioVsRef;

    bilan.push({
      annee,
      coutActuel,
      coutRef,
      coutBiomasse,
      economieBioVsRef,
      economieBioVsActuel,
      cumulEconomies,
    });
  }

  return bilan;
}

export function calculTempsRetourInvestissement(
  surcoutInvestissement: number,
  economieAnnuelle: number
): number {
  if (economieAnnuelle === 0) return Infinity;
  return surcoutInvestissement / economieAnnuelle;
}

/**
 * Bilan CO2/SO2
 */
export interface EmissionsBilan {
  consommationKwh: number;
  consommationTonnes: number;
  tep: number;
  co2AnnuelTonnes: number;
  so2AnnuelTonnes: number;
}

export function calculEmissions(
  consommationKwh: number,
  facteurCO2: number, // kg/kWh
  facteurSO2: number // kg/kWh
): EmissionsBilan {
  const consommationTonnes = consommationKwh / 1000; // tonnes de combustible (approx)
  const tep = consommationKwh / 12602; // tonnes d'équivalent pétrole
  const co2AnnuelTonnes = (consommationKwh * facteurCO2) / 1000;
  const so2AnnuelTonnes = (consommationKwh * facteurSO2) / 1000;

  return {
    consommationKwh,
    consommationTonnes,
    tep,
    co2AnnuelTonnes,
    so2AnnuelTonnes,
  };
}

export interface GainEnvironnemental {
  gainCO2: number; // tonnes/an
  gainSO2: number; // tonnes/an
  gainEn20ans: {
    co2: number;
    so2: number;
  };
}

export function calculGainEnvironnemental(
  emissionsRef: EmissionsBilan,
  emissionsBio: EmissionsBilan,
  dureeAnnees: number = 20
): GainEnvironnemental {
  const gainCO2 = emissionsRef.co2AnnuelTonnes - emissionsBio.co2AnnuelTonnes;
  const gainSO2 = emissionsRef.so2AnnuelTonnes - emissionsBio.so2AnnuelTonnes;

  return {
    gainCO2,
    gainSO2,
    gainEn20ans: {
      co2: gainCO2 * dureeAnnees,
      so2: gainSO2 * dureeAnnees,
    },
  };
}
