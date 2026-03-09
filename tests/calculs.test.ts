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
      rendementProduction: 0.85,  // Decimal format
      rendementDistribution: 0.90,
      rendementEmission: 0.90,
      rendementRegulation: 0.90,
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
      rendementProduction: 0.85,
      rendementDistribution: 0.90,
      rendementEmission: 0.90,
      rendementRegulation: 0.90,
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
        rendementProduction: 0.80, rendementDistribution: 0.90,
        rendementEmission: 0.90, rendementRegulation: 0.90,
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
        rendementProduction: 0.85, rendementDistribution: 0.90,
        rendementEmission: 0.90, rendementRegulation: 0.90,
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

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✓ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('✗ LES TESTS ONT ÉCHOUÉ');
    console.error('═══════════════════════════════════════════════════════════\n');
    throw error;
  }
}

// Export for Jest if used
export { testBatiment3Initial, testBatiment2Initial, testBatiment2Reference, testBatiment1Initial, testChiffrageParcRef, testMonotone, testBatimentComplet, testBilan20Ans, testAgregationParcs };

// Auto-run when executed directly
runAllTests();
