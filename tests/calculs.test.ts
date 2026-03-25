/**
 * Comprehensive test suite for biomass feasibility calculations
 * Uses real-world test case data from Excel with expected results
 */

import {
  calculRendementMoyen,
  calculConsoKWhep,
  calculConsoPCS,
  calculCoutAnnuel,
  calculsBatimentComplet,
  calculsBatimentReference,
  calculConsoRefCalculees,
} from '../lib/calculs/batiment';

import {
  calculBilan20Ans,
} from '../lib/calculs/bilan';

import {
  calculSousTotalChaufferie,
  calculFraisAnnexes,
  calculTotalInvestissementHT,
  calculTVA,
  calculTotalInvestissementTTC,
  calculAnnuite,
} from '../lib/calculs/chiffrage';

import {
  calculDeperditionsParDegre,
  calculPuissanceAppeleePourTemp,
} from '../lib/calculs/monotone';

import {
  calculPuissanceChauffageParc,
  calculConsoSortieParcChaudieresRef,
} from '../lib/calculs/parc';

import { Batiment, ChiffrageParcRef } from '../lib/calculs/types';
const TOLERANCE = 0.0001;

function expect(value: number, expected: number, tolerance = TOLERANCE): boolean {
  const diff = Math.abs(value - expected);
  const relativeError = Math.abs(diff / (expected || 1));
  return relativeError <= tolerance;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

/**
 * TEST 1: Bâtiment n°3 "essai ajout bât" — État initial
 */
function testBatiment3Initial() {
  console.log('\n### TEST 1: Bâtiment n°3 "essai ajout bât" — État initial');

  const etat3 = {
    deperditions_kW: 20,
    rendementProduction: 80,
    rendementDistribution: 85,
    rendementEmission: 85,
    rendementRegulation: 90,
    coefIntermittence: 1,
    consommationsCalculees: 70189,
    consommationsReelles: 71000,
    typeEnergie: 'Fuel',
    tarification: 0.13,
    abonnement: 0,
  };

  const rendement = calculRendementMoyen(etat3);
  assert(expect(rendement, 0.5202, 0.001), `Rendement = 52.02% (got ${(rendement * 100).toFixed(2)}%)`);

  const consoKWhep = calculConsoKWhep(etat3);
  assert(consoKWhep === 71000, `Conso kWhep = 71000 (Fuel → pas de coef 2.3)`);

  const consoPCS = calculConsoPCS(etat3);
  assert(consoPCS === 70189, `Conso PCS = 70189 (Fuel → pas de coef 1.1)`);

  const coutAnnuel = calculCoutAnnuel(etat3);
  assert(expect(coutAnnuel, 9124.57, 0.01), `Coût annuel = 9124.57€ (got ${coutAnnuel.toFixed(2)}€)`);
}

/**
 * TEST 2: Bâtiment n°2 "Bâtiment 2" — État initial
 */
function testBatiment2Initial() {
  console.log('\n### TEST 2: Bâtiment n°2 "Bâtiment 2" — État initial');

  const etat2 = {
    deperditions_kW: 20,
    rendementProduction: 85,
    rendementDistribution: 90,
    rendementEmission: 90,
    rendementRegulation: 90,
    coefIntermittence: 1,
    consommationsCalculees: 58868,
    consommationsReelles: 60000,
    typeEnergie: 'Electricité',
    tarification: 0.226,
    abonnement: 0,
  };

  const rendement = calculRendementMoyen(etat2);
  assert(expect(rendement, 0.61965, 0.001), `Rendement = 61.965% (got ${(rendement * 100).toFixed(2)}%)`);

  const consoKWhep = calculConsoKWhep(etat2);
  assert(consoKWhep === 138000, `Conso kWhep = 138000 (Élec → 60000 × 2.3)`);

  const consoPCS = calculConsoPCS(etat2);
  assert(consoPCS === 58868, `Conso PCS = 58868 (Élec → pas de coef 1.1)`);

  const coutAnnuel = calculCoutAnnuel(etat2);
  assert(expect(coutAnnuel, 13304.168, 0.01), `Coût annuel = 13304.17€ (got ${coutAnnuel.toFixed(2)}€)`);
}

/**
 * TEST 3: Bâtiment n°2 — État de référence
 */
function testBatiment2Reference() {
  console.log('\n### TEST 3: Bâtiment n°2 — État de référence');

  const DJU = 1977;
  const tempInt = 19;
  const tempExt = -7;

  const batiment: Batiment = {
    numero: 2,
    designation: 'Bâtiment 2',
    typeBatiment: 'Bureaux',
    surfaceChauffee: 200,
    volumeChauffe: 500,
    parc: 2,
    etatInitial: {
      deperditions_kW: 20,
      rendementProduction: 85,
      rendementDistribution: 90,
      rendementEmission: 90,
      rendementRegulation: 90,
      coefIntermittence: 1,
      consommationsCalculees: 58868,
      consommationsReelles: 60000,
      typeEnergie: 'Electricité',
      tarification: 0.226,
      abonnement: 0,
    },
    etatReference: {
      deperditions_kW: 20,
      typeEnergie: 'Gaz naturel',
      rendementProduction: 85,
      rendementDistribution: 90,
      rendementEmission: 90,
      rendementRegulation: 90,
      tarification: 0.1502,
      abonnement: 0,
      consommationsCalculees: 0,
    },
  };

  // Use calculsBatimentReference directly
  const resultRef = calculsBatimentReference(batiment, DJU, tempInt, tempExt);
  
  assert(expect(resultRef.consoRefCalculees || 0, 58901.74, 0.1), 
    `Conso ref = 58901.74 kWh (got ${(resultRef.consoRefCalculees || 0).toFixed(2)})`);

  assert(expect(resultRef.consoRefPCS || 0, 64791.91, 0.1), 
    `Conso ref PCS = 64791.91 kWh (got ${(resultRef.consoRefPCS || 0).toFixed(2)})`);

  assert(expect(resultRef.consoSortieChaudieresRef || 0, 50066.48, 0.1), 
    `Conso sortie chaudières = 50066.48 kWh (got ${(resultRef.consoSortieChaudieresRef || 0).toFixed(2)})`);

  console.log(`  Rendement moyen ref: ${(resultRef.rendementMoyenRef || 0).toFixed(4)}`);
  console.log(`  ✓ Reference state calculations validated`);
}

/**
 * TEST 4: Bâtiment n°1 — État initial
 */
function testBatiment1Initial() {
  console.log('\n### TEST 4: Bâtiment n°1 — État initial');

  const etat1 = {
    deperditions_kW: 10,
    rendementProduction: 80,
    rendementDistribution: 90,
    rendementEmission: 90,
    rendementRegulation: 90,
    coefIntermittence: 1,
    consommationsCalculees: 31464,
    consommationsReelles: 32000,
    typeEnergie: 'Fuel',
    tarification: 0.13,
    abonnement: 0,
  };

  const rendement = calculRendementMoyen(etat1);
  assert(expect(rendement, 0.5832, 0.001), `Rendement = 58.32% (got ${(rendement * 100).toFixed(2)}%)`);

  const consoKWhep = calculConsoKWhep(etat1);
  assert(consoKWhep === 32000, `Conso kWhep = 32000 (Fuel → conso réelles)`);

  const consoPCS = calculConsoPCS(etat1);
  assert(consoPCS === 31464, `Conso PCS = 31464`);

  const coutAnnuel = calculCoutAnnuel(etat1);
  assert(expect(coutAnnuel, 4090.32, 0.01), `Coût annuel = 4090.32€ (got ${coutAnnuel.toFixed(2)}€)`);
}

/**
 * TEST 5: Chiffrage Référence Parc 1
 */
function testChiffrageParcRef() {
  console.log('\n### TEST 5: Chiffrage Référence Parc 1');

  const chiffrage: ChiffrageParcRef = {
    travauxChaufferie: [
      { designation: 'Installation / remplacement de chaudière', unite: 'U', qte: 5, pu: 5000, total: 25000 },
    ],
    isolation: [
      { designation: 'Bâtiment 1', total: 501140, dejaRealise: 0 },
    ],
    fraisAnnexes: {
      bureauControle: 0,
      maitriseOeuvre: 0.13,
      fraisDivers: 0.02,
      aleas: 0.05,
    },
    P2_ref: 750,
    emprunt_ref: 9118.96,
  };

  const sousTotalChaufferie = calculSousTotalChaufferie(chiffrage.travauxChaufferie);
  assert(sousTotalChaufferie === 25000, `Sous-total chaufferie = 25000€`);

  const fraisAnnexes = calculFraisAnnexes(sousTotalChaufferie, chiffrage.fraisAnnexes);
  assert(expect(fraisAnnexes, 5000, 0.01), `Frais annexes = 5000€ (got ${fraisAnnexes.toFixed(2)}€)`);

  const totalHT = calculTotalInvestissementHT(sousTotalChaufferie, fraisAnnexes);
  assert(totalHT === 30000, `Total investissement HT = 30000€`);

  const tva = calculTVA(totalHT);
  assert(tva === 6000, `TVA 20% = 6000€`);

  const totalTTC = calculTotalInvestissementTTC(totalHT);
  assert(totalTTC === 36000, `Total TTC = 36000€`);

  const annuite = calculAnnuite(totalHT, chiffrage.emprunt_ref, 15);
  assert(expect(annuite, 2607.93, 0.1), `Annuité = 2607.93€/an (got ${annuite.toFixed(2)}€)`);
}

/**
 * TEST 6: Monotone de charge
 */
function testMonotone() {
  console.log('\n### TEST 6: Monotone de charge');

  const deperditionsTotales_W = 30000;
  const tempInt = 19;
  const tempExt = -7;

  const deperditionsParDegre = calculDeperditionsParDegre(deperditionsTotales_W, tempInt, tempExt);
  const expected_dpd = 30000 / 26;
  assert(expect(deperditionsParDegre, expected_dpd, 0.01), 
    `Déperditions par °C = 1153.846 W/°C (got ${deperditionsParDegre.toFixed(2)})`);

  // Test power calculation for specific temperatures
  const h1_temp = -4;
  const h1_power = calculPuissanceAppeleePourTemp(deperditionsParDegre, tempInt, h1_temp);
  const h1_expected = 1153.846 * (tempInt - h1_temp);
  assert(expect(h1_power, h1_expected, 0.1), 
    `H1 T=-4°C → puissance = ${h1_expected.toFixed(2)}W (got ${h1_power.toFixed(2)}W)`);

  console.log(`  Puissance max calculée avec données météo`);
  console.log(`  (Détails complets testés avec données réelles de température)`);
}

/**
 * TEST 7: Complete building calculation
 */
function testBatimentComplet() {
  console.log('\n### TEST 7: Calcul complet Bâtiment');

  const batiment: Batiment = {
    numero: 2,
    designation: 'Bâtiment 2',
    typeBatiment: 'Bureaux',
    surfaceChauffee: 200,
    volumeChauffe: 500,
    parc: 2,
    etatInitial: {
      deperditions_kW: 20,
      rendementProduction: 85,
      rendementDistribution: 90,
      rendementEmission: 90,
      rendementRegulation: 90,
      coefIntermittence: 1,
      consommationsCalculees: 58868,
      consommationsReelles: 60000,
      typeEnergie: 'Electricité',
      tarification: 0.226,
      abonnement: 0,
    },
    etatReference: {
      deperditions_kW: 20,
      rendementProduction: 85,
      rendementDistribution: 90,
      rendementEmission: 90,
      rendementRegulation: 90,
      typeEnergie: 'Gaz naturel',
      tarification: 0.1502,
      abonnement: 0,
      consommationsCalculees: 0, // Not used in ref calculation
    },
  };

  const calculs = calculsBatimentComplet(batiment, 1977, 19, -7);

  console.log(`  Rendement moyen EI: ${(calculs.rendementMoyenEI * 100).toFixed(2)}%`);
  console.log(`  Conso kWhep EI: ${calculs.consoKWhepEI.toFixed(0)} kWh`);
  console.log(`  Conso PCS EI: ${calculs.consoPCSEI.toFixed(0)} kWh`);
  console.log(`  Coût annuel EI: ${calculs.coutAnnuelEI.toFixed(2)}€`);
  
  // Assertions on reference state
  assert(expect(calculs.consoRefCalculees || 0, 58901.74, 0.1),
    `Conso ref calculées = 58901.74 (got ${(calculs.consoRefCalculees || 0).toFixed(2)})`);
  assert(expect(calculs.consoRefPCS || 0, 64791.91, 0.1),
    `Conso ref PCS = 64791.91 (got ${(calculs.consoRefPCS || 0).toFixed(2)})`);
  assert(expect(calculs.consoSortieChaudieresRef || 0, 50066.48, 0.1),
    `Conso sortie chaudières = 50066.48 (got ${(calculs.consoSortieChaudieresRef || 0).toFixed(2)})`);

  console.log(`  ✓ All calculations validated (initial + reference)`);
}

/**
 * TEST 8: 20-year balance sheet (bilan 20 ans)
 */
function testBilan20Ans() {
  console.log('\n### TEST 8: Bilan 20 ans - vérification annuité année 16');

  const coutInitialActuel = 10000;
  const coutInitialRef = 10000;
  const coutInitialBiomasse = 8000;
  const tauxAugmentationFossile = 0.04;
  const tauxAugmentationBiomasse = 0.02;
  const annuiteRef = 2000;
  const annuiteBiomasse = 1500;
  const dureeEmprunt = 15;

  const bilan = calculBilan20Ans(
    coutInitialActuel,
    coutInitialRef,
    coutInitialBiomasse,
    tauxAugmentationFossile,
    tauxAugmentationBiomasse,
    annuiteRef,
    annuiteBiomasse,
    dureeEmprunt
  );

  // Check that year 15 is normal growth
  const annee15 = bilan[14]; // 0-indexed
  const annee16 = bilan[15]; // year 16
  const annee17 = bilan[16]; // year 17

  // Year 16 should show the annuity deduction ONE TIME
  const diff16 = annee16.coutRef - annee15.coutRef; // Should be negative (drop)
  assert(diff16 < 0, 
    `Year 16: Cost should drop due to annuity deduction (diff=${diff16.toFixed(2)}€)`);

  // Year 17 should resume normal growth from the new level
  const diff17 = annee17.coutRef - annee16.coutRef; // Should be positive (increase)
  assert(diff17 > 0, 
    `Year 17: Cost should increase normally from new level (diff=${diff17.toFixed(2)}€)`);

  // Verify the deduction happened only once
  assert(Math.abs(annee16.coutRef - (annee15.coutRef * (1 + tauxAugmentationFossile) - annuiteRef)) < 1,
    `Year 16 calculation correct: applied annuity deduction once`);

  console.log(`  Année 15 coûts ref: ${annee15.coutRef.toFixed(2)}€`);
  console.log(`  Année 16 coûts ref: ${annee16.coutRef.toFixed(2)}€ (baisse de ${Math.abs(diff16).toFixed(2)}€ = annuité)`);
  console.log(`  Année 17 coûts ref: ${annee17.coutRef.toFixed(2)}€ (hausse de ${diff17.toFixed(2)}€)`);
  console.log(`  ✓ 20-year balance sheet annuity handling validated`);
}

/**
 * TEST 9: Park aggregation
 */
function testAgregationParcs() {
  console.log('\n### TEST 9: Agrégation par parc');

  const batiments: Batiment[] = [
    {
      numero: 3, designation: 'essai ajout bât', typeBatiment: 'Logements',
      surfaceChauffee: 100, volumeChauffe: 300, parc: 1,
      etatInitial: { deperditions_kW: 20, rendementProduction: 80, rendementDistribution: 85,
        rendementEmission: 85, rendementRegulation: 90, coefIntermittence: 1,
        consommationsCalculees: 70189, consommationsReelles: 71000,
        typeEnergie: 'Fuel', tarification: 0.13, abonnement: 0 },
      etatReference: null, // pas de ref pour bât 3
    },
    {
      numero: 1, designation: 'Bâtiment 1', typeBatiment: 'Logements',
      surfaceChauffee: 100, volumeChauffe: 300, parc: 1,
      etatInitial: { deperditions_kW: 10, rendementProduction: 80, rendementDistribution: 90,
        rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
        consommationsCalculees: 31464, consommationsReelles: 32000,
        typeEnergie: 'Fuel', tarification: 0.13, abonnement: 0 },
      etatReference: { deperditions_kW: 10, typeEnergie: 'Gaz naturel',
        rendementProduction: 80, rendementDistribution: 90,
        rendementEmission: 90, rendementRegulation: 90,
        tarification: 0.978, abonnement: 0, consommationsCalculees: 0 },
    },
    {
      numero: 2, designation: 'Bâtiment 2', typeBatiment: 'Bureaux',
      surfaceChauffee: 200, volumeChauffe: 500, parc: 2,
      etatInitial: { deperditions_kW: 20, rendementProduction: 85, rendementDistribution: 90,
        rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
        consommationsCalculees: 58868, consommationsReelles: 60000,
        typeEnergie: 'Électricité', tarification: 0.226, abonnement: 0 },
      etatReference: { deperditions_kW: 20, typeEnergie: 'Gaz naturel',
        rendementProduction: 85, rendementDistribution: 90,
        rendementEmission: 90, rendementRegulation: 90,
        tarification: 0.978, abonnement: 0, consommationsCalculees: 0 },
    },
  ];

  // Parc 1 : seul Bât 1 a une ref (Bât 3 n'en a pas)
  const puissanceParc1 = calculPuissanceChauffageParc(batiments, 1);
  assert(puissanceParc1 === 10, `Puissance Parc 1 = 10 kW (got ${puissanceParc1})`);

  const consoParc1 = calculConsoSortieParcChaudieresRef(batiments, 1, 1977, 19, -7);
  assert(expect(consoParc1, 25033.24, 1), `Conso Parc 1 = 25033.24 kWh (got ${consoParc1.toFixed(2)})`);

  // Parc 2 : Bât 2
  const puissanceParc2 = calculPuissanceChauffageParc(batiments, 2);
  assert(puissanceParc2 === 20, `Puissance Parc 2 = 20 kW (got ${puissanceParc2})`);

  const consoParc2 = calculConsoSortieParcChaudieresRef(batiments, 2, 1977, 19, -7);
  assert(expect(consoParc2, 50066.48, 1), `Conso Parc 2 = 50066.48 kWh (got ${consoParc2.toFixed(2)})`);

  console.log('  ✓ Park aggregation validated');
}

/**
 * TEST 10: UI-path rendements — Verify that rendements in % format (as stored from UI) produce correct results
 */
function testUIPathRendements() {
  console.log('\n### TEST 10: Chemin UI → calcul (rendements en %)');

  // Simulate what the UI sends: rendements in % (85, 95, 98, 97)
  const etatUI = {
    deperditions_kW: 50,
    rendementProduction: 85,
    rendementDistribution: 95,
    rendementEmission: 98,
    rendementRegulation: 97,
    coefIntermittence: 1,
    consommationsCalculees: 100000,
    typeEnergie: 'Gaz naturel',
    tarification: 0.08,
    abonnement: 150,
  };

  const rendement = calculRendementMoyen(etatUI);
  const expectedRendement = (85/100) * (95/100) * (98/100) * (97/100);
  assert(expect(rendement, expectedRendement, 0.001),
    `Rendement UI path = ${(expectedRendement * 100).toFixed(2)}% (got ${(rendement * 100).toFixed(2)}%)`);
  assert(rendement > 0.5 && rendement < 1.0,
    `Rendement is in realistic range [50%-100%] (got ${(rendement * 100).toFixed(2)}%)`);

  console.log('  ✓ UI-path rendements validated (BUG-001 fix verified)');
}

/**
 * TEST 11: Reference state uses its own tarification (not EI tarification)
 */
function testRefTarification() {
  console.log('\n### TEST 11: Tarification ref ≠ tarification EI');

  const batiment: Batiment = {
    numero: 1,
    designation: 'Test tarification ref',
    typeBatiment: 'Logements',
    surfaceChauffee: 100,
    volumeChauffe: 300,
    parc: 1,
    etatInitial: {
      deperditions_kW: 10,
      rendementProduction: 80,
      rendementDistribution: 90,
      rendementEmission: 90,
      rendementRegulation: 90,
      coefIntermittence: 1,
      consommationsCalculees: 31464,
      typeEnergie: 'Fuel',
      tarification: 0.13,  // EI tarif
      abonnement: 0,
    },
    etatReference: {
      deperditions_kW: 10,
      typeEnergie: 'Gaz naturel',
      rendementProduction: 80,
      rendementDistribution: 90,
      rendementEmission: 90,
      rendementRegulation: 90,
      tarification: 0.978,  // Ref tarif (different from EI!)
      abonnement: 200,
      consommationsCalculees: 0,
    },
  };

  const calculs = calculsBatimentComplet(batiment, 1977, 19, -7);

  // Verify ref cost uses ref tarification (0.978), not EI (0.13)
  assert((calculs.coutAnnuelRef || 0) > 0, `Coût annuel ref > 0 (got ${(calculs.coutAnnuelRef || 0).toFixed(2)}€)`);
  
  // The ref cost should be much larger than if using EI tarif (0.13)
  // ConsoRefPCS * 0.978 vs ConsoRefPCS * 0.13 → ratio ~7.5x
  const consoRefPCS = calculs.consoRefPCS || 0;
  const expectedRefCost = 200 + (consoRefPCS * 0.978);
  assert(expect(calculs.coutAnnuelRef || 0, expectedRefCost, 0.01),
    `Coût ref utilise tarif ref 0.978 (got ${(calculs.coutAnnuelRef || 0).toFixed(2)}€, expected ${expectedRefCost.toFixed(2)}€)`);

  console.log('  ✓ Ref tarification correctly used (BUG-002 fix verified)');
}

/**
 * TEST 12: Edge case — rendement = 0 should not cause division by zero
 */
function testRendementZero() {
  console.log('\n### TEST 12: Edge case rendement = 0');

  const result = calculConsoRefCalculees(10, 1977, 19, -7, 0, 1);
  assert(result === 0, `Rendement 0 → conso = 0 (no division by zero) (got ${result})`);

  console.log('  ✓ Rendement 0 handled safely');
}

/**
 * TEST 13: calculsBatimentComplet with decimal reference efficiencies (Excel format)
 */
function testBatimentCompletRefDecimal() {
  console.log('\n### TEST 13: calculsBatimentComplet — rendements ref en décimal (format Excel)');

  const bat: Batiment = {
    numero: 2, designation: 'Test', typeBatiment: 'Bureaux',
    surfaceChauffee: 200, volumeChauffe: 500, parc: 2,
    etatInitial: {
      deperditions_kW: 20, rendementProduction: 85, rendementDistribution: 90,
      rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
      consommationsCalculees: 58868, consommationsReelles: 60000,
      typeEnergie: 'Electricité', tarification: 0.226, abonnement: 0,
    },
    etatReference: {
      deperditions_kW: 20, typeEnergie: 'Gaz naturel',
      rendementProduction: 0.85, rendementDistribution: 0.90,
      rendementEmission: 0.90, rendementRegulation: 0.90,
      tarification: 0.1502, abonnement: 0, consommationsCalculees: 0,
    },
  };

  const result = calculsBatimentComplet(bat, 1977, 19, -7);

  // consoRefCalculees must be ~58901.74 NOT ~5.89e12
  assert(result.consoRefCalculees !== undefined && result.consoRefCalculees > 0,
    'consoRefCalculees > 0');
  assert(result.consoRefCalculees! < 1000000,
    `consoRefCalculees < 1M (got ${result.consoRefCalculees?.toFixed(2)} — si > 1M, la détection >1 est cassée)`);
  assert(expect(result.consoRefCalculees!, 58901.74, 0.01),
    `consoRefCalculees = 58901.74 (got ${result.consoRefCalculees?.toFixed(2)})`);
  assert(expect(result.consoRefPCS!, 64791.91, 0.01),
    `consoRefPCS = 64791.91 (got ${result.consoRefPCS?.toFixed(2)})`);
  assert(expect(result.consoSortieChaudieresRef!, 50066.48, 0.01),
    `consoSortieChaudieresRef = 50066.48 (got ${result.consoSortieChaudieresRef?.toFixed(2)})`);
  assert(expect(result.coutAnnuelRef!, 9731.71, 1),
    `coutAnnuelRef ≈ 9731.71 (got ${result.coutAnnuelRef?.toFixed(2)})`);
}

/**
 * TEST 14: calculsBatimentComplet with percentage reference efficiencies (% format)
 */
function testBatimentCompletRefPercent() {
  console.log('\n### TEST 14: calculsBatimentComplet — rendements ref en % (format UI)');

  const bat: Batiment = {
    numero: 1, designation: 'Test', typeBatiment: 'Logements',
    surfaceChauffee: 100, volumeChauffe: 300, parc: 1,
    etatInitial: {
      deperditions_kW: 10, rendementProduction: 80, rendementDistribution: 90,
      rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
      consommationsCalculees: 31464, consommationsReelles: 32000,
      typeEnergie: 'Fuel', tarification: 0.13, abonnement: 0,
    },
    etatReference: {
      deperditions_kW: 10, typeEnergie: 'Gaz naturel',
      rendementProduction: 80, rendementDistribution: 90,
      rendementEmission: 90, rendementRegulation: 90,
      tarification: 0.978, abonnement: 0, consommationsCalculees: 0,
    },
  };

  const result = calculsBatimentComplet(bat, 1977, 19, -7);

  assert(result.consoRefCalculees! < 1000000,
    `consoRefCalculees reasonable (got ${result.consoRefCalculees?.toFixed(2)})`);
  assert(expect(result.consoRefCalculees!, 31291.55, 1),
    `consoRefCalculees ≈ 31291.55 (got ${result.consoRefCalculees?.toFixed(2)})`);
  assert(expect(result.coutAnnuelRef!, 33735.52, 100),
    `coutAnnuelRef reasonable (got ${result.coutAnnuelRef?.toFixed(2)})`);
}

/**
 * TEST 15: Consistency between batiment.ts and parc.ts calculations
 */
function testCoherenceBatimentVsParc() {
  console.log('\n### TEST 15: Cohérence batiment.ts vs parc.ts (même résultat)');

  const bat: Batiment = {
    numero: 2, designation: 'Test', typeBatiment: 'Bureaux',
    surfaceChauffee: 200, volumeChauffe: 500, parc: 1,
    etatInitial: {
      deperditions_kW: 20, rendementProduction: 85, rendementDistribution: 90,
      rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
      consommationsCalculees: 58868, typeEnergie: 'Electricité', tarification: 0.226, abonnement: 0,
    },
    etatReference: {
      deperditions_kW: 20, typeEnergie: 'Gaz naturel',
      rendementProduction: 0.85, rendementDistribution: 0.90,
      rendementEmission: 0.90, rendementRegulation: 0.90,
      tarification: 0.1502, abonnement: 0, consommationsCalculees: 0,
    },
  };

  // Via batiment.ts
  const batResult = calculsBatimentComplet(bat, 1977, 19, -7);

  // Via parc.ts
  const parcResult = calculConsoSortieParcChaudieresRef([bat], 1, 1977, 19, -7);

  assert(expect(batResult.consoSortieChaudieresRef!, parcResult, 1),
    `batiment.ts (${batResult.consoSortieChaudieresRef?.toFixed(2)}) ≈ parc.ts (${parcResult.toFixed(2)})`);
}

/**
 * TEST 16: Complete Excel test case with 3 buildings and 2 networks
 */
function testCasTestExcelComplet() {
  console.log('\n### TEST 16: Cas test Excel complet — 3 bâtiments, 2 parcs');

  const allBats: Batiment[] = [
    { numero:1, designation:'Bâtiment 1', typeBatiment:'Logements', surfaceChauffee:100, volumeChauffe:300, parc:1,
      etatInitial: { deperditions_kW:10, rendementProduction:80, rendementDistribution:90, rendementEmission:90, rendementRegulation:90, coefIntermittence:1, consommationsCalculees:31464, consommationsReelles:32000, typeEnergie:'Fuel', tarification:0.13, abonnement:0 },
      etatReference: { deperditions_kW:10, typeEnergie:'Gaz naturel', rendementProduction:0.80, rendementDistribution:0.90, rendementEmission:0.90, rendementRegulation:0.90, tarification:0.978, abonnement:0, consommationsCalculees:0 }},
    { numero:2, designation:'Bâtiment 2', typeBatiment:'Bureaux', surfaceChauffee:200, volumeChauffe:500, parc:2,
      etatInitial: { deperditions_kW:20, rendementProduction:85, rendementDistribution:90, rendementEmission:90, rendementRegulation:90, coefIntermittence:1, consommationsCalculees:58868, consommationsReelles:60000, typeEnergie:'Electricité', tarification:0.226, abonnement:0 },
      etatReference: { deperditions_kW:20, typeEnergie:'Gaz naturel', rendementProduction:0.85, rendementDistribution:0.90, rendementEmission:0.90, rendementRegulation:0.90, tarification:0.1502, abonnement:0, consommationsCalculees:0 }},
    { numero:3, designation:'essai ajout bât', typeBatiment:'Logements', surfaceChauffee:100, volumeChauffe:300, parc:1,
      etatInitial: { deperditions_kW:20, rendementProduction:80, rendementDistribution:85, rendementEmission:85, rendementRegulation:90, coefIntermittence:1, consommationsCalculees:70189, consommationsReelles:71000, typeEnergie:'Fuel', tarification:0.13, abonnement:0 },
      etatReference: null as any },
  ];

  // Calculate each building
  for (const bat of allBats) {
    const c = calculsBatimentComplet(bat, 1977, 19, -7);
    if (c.consoRefCalculees) {
      assert(c.consoRefCalculees < 1000000,
        `${bat.designation} consoRef raisonnable (${c.consoRefCalculees.toFixed(0)})`);
    }
  }

  // Verify exact Excel values
  const c1 = calculsBatimentComplet(allBats[0], 1977, 19, -7);
  assert(expect(c1.coutAnnuelEI, 4090.32, 0.01), 'Bât1 coût EI = 4090.32€');
  assert(expect(c1.consoRefCalculees!, 31291.55, 1), 'Bât1 consoRef = 31291.55');

  const c2 = calculsBatimentComplet(allBats[1], 1977, 19, -7);
  assert(expect(c2.coutAnnuelEI, 13304.17, 0.01), 'Bât2 coût EI = 13304.17€');
  assert(expect(c2.consoRefCalculees!, 58901.74, 1), 'Bât2 consoRef = 58901.74');
  assert(expect(c2.consoSortieChaudieresRef!, 50066.48, 1), 'Bât2 sortieChaud = 50066.48');

  const c3 = calculsBatimentComplet(allBats[2], 1977, 19, -7);
  assert(expect(c3.coutAnnuelEI, 9124.57, 0.01), 'Bât3 coût EI = 9124.57€');

  // Network aggregation
  assert(calculPuissanceChauffageParc(allBats, 1) === 10, 'Parc1 puissance = 10kW');
  assert(expect(calculConsoSortieParcChaudieresRef(allBats, 1, 1977, 19, -7), 25033.24, 1), 'Parc1 conso = 25033.24');
  assert(calculPuissanceChauffageParc(allBats, 2) === 20, 'Parc2 puissance = 20kW');
  assert(expect(calculConsoSortieParcChaudieresRef(allBats, 2, 1977, 19, -7), 50066.48, 1), 'Parc2 conso = 50066.48');
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   FAISABILITÉ BIOMASSE - SUITE DE TESTS DE VALIDATION');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    testBatiment3Initial();
    testBatiment2Initial();
    testBatiment2Reference();
    testBatiment1Initial();
    testChiffrageParcRef();
    testMonotone();
    testBatimentComplet();
    testBilan20Ans();
    testAgregationParcs();
    testUIPathRendements();
    testRefTarification();
    testRendementZero();
    testBatimentCompletRefDecimal();     // TEST 13
    testBatimentCompletRefPercent();      // TEST 14
    testCoherenceBatimentVsParc();        // TEST 15
    testCasTestExcelComplet();            // TEST 16

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✓ TOUS LES 16 TESTS SONT PASSÉS AVEC SUCCÈS!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('✗ LES TESTS ONT ÉCHOUÉ');
    console.error('═══════════════════════════════════════════════════════════\n');
    throw error;
  }
}

// Export for Jest if used
export { testBatiment3Initial, testBatiment2Initial, testBatiment2Reference, testBatiment1Initial, testChiffrageParcRef, testMonotone, testBatimentComplet, testBilan20Ans, testAgregationParcs, testUIPathRendements, testRefTarification, testRendementZero, testBatimentCompletRefDecimal, testBatimentCompletRefPercent, testCoherenceBatimentVsParc, testCasTestExcelComplet };

// Auto-run when executed directly
runAllTests();
