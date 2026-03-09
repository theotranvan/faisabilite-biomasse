/**
 * Test runner for biomass feasibility calculations
 * Validates calculations against real-world Excel test case data
 */

import {
  calculRendementMoyen,
  calculConsoKWhep,
  calculConsoPCS,
  calculCoutAnnuel,
  calculConsoRefCalculees,
  calculConsoRefPCS,
  calculConsoSortieChaudieresRef,
} from '../lib/calculs/batiment';

import {
  calculSousTotalChaufferie,
  calculFraisAnnexes,
  calculTotalInvestissementHT,
  calculTVA,
  calculTotalInvestissementTTC,
  calculAnnuite,
} from '../lib/calculs/chiffrage';

import { calculDeperditionsParDegre, calculPuissanceAppeleePourTemp } from '../lib/calculs/monotone';

// Tolerance for floating-point comparisons
const TOLERANCE = 0.0001;

function checkValue(actual: number, expected: number, label: string): boolean {
  const diff = Math.abs(actual - expected);
  const relativeError = Math.abs(diff / (expected || 1));
  const passed = relativeError <= TOLERANCE;

  const status = passed ? '✓' : '✗';
  console.log(`  ${status} ${label}`);
  if (!passed) {
    console.log(`    Expected: ${expected.toFixed(4)}, Got: ${actual.toFixed(4)}`);
  }

  return passed;
}

function runTests() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('   CALCULS FAISABILITÉ BIOMASSE - Test Suite');
  console.log('══════════════════════════════════════════════════\n');

  let totalTests = 0;
  let passedTests = 0;

  // TEST 1: Bâtiment 3 - État initial
  console.log('Test 1: Bâtiment n°3 "essai ajout bât" - État Initial');
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

  totalTests++;
  if (checkValue(calculRendementMoyen(etat3), 0.5202, 'Rendement moyen = 52.02%')) passedTests++;

  totalTests++;
  if (checkValue(calculConsoKWhep(etat3), 71000, 'Conso kWhep = 71000 kWh')) passedTests++;

  totalTests++;
  if (checkValue(calculConsoPCS(etat3), 70189, 'Conso PCS = 70189 kWh')) passedTests++;

  totalTests++;
  if (checkValue(calculCoutAnnuel(etat3), 9124.57, 'Coût annuel = 9124.57€')) passedTests++;

  // TEST 2: Bâtiment 2 - État initial
  console.log('\nTest 2: Bâtiment n°2 "Bâtiment 2" - État Initial');
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

  totalTests++;
  if (checkValue(calculRendementMoyen(etat2), 0.61965, 'Rendement moyen = 61.965%')) passedTests++;

  totalTests++;
  if (checkValue(calculConsoKWhep(etat2), 138000, 'Conso kWhep = 138000 kWh')) passedTests++;

  totalTests++;
  if (checkValue(calculConsoPCS(etat2), 58868, 'Conso PCS = 58868 kWh')) passedTests++;

  totalTests++;
  if (checkValue(calculCoutAnnuel(etat2), 13304.168, 'Coût annuel = 13304.17€')) passedTests++;

  // TEST 3: Bâtiment 2 - État de référence
  console.log('\nTest 3: Bâtiment n°2 "Bâtiment 2" - État Référence');
  const DJU = 1977;
  const tempInt = 19;
  const tempExt = -7;

  const etatRef = {
    deperditions_kW: 20,
    typeEnergie: 'Gaz naturel',
    rendementProduction: 0.85,
    rendementDistribution: 0.90,
    rendementEmission: 0.90,
    rendementRegulation: 0.90,
  };

  const rendementMoyenRef =
    etatRef.rendementProduction * etatRef.rendementDistribution * etatRef.rendementEmission * etatRef.rendementRegulation;

  const consoRefCalculees = calculConsoRefCalculees(etatRef.deperditions_kW, DJU, tempInt, tempExt, rendementMoyenRef, 1);

  totalTests++;
  if (checkValue(consoRefCalculees, 58901.74, 'Conso ref calculées = 58901.74 kWh')) passedTests++;

  const consoRefPCS = calculConsoRefPCS(consoRefCalculees, 'Gaz naturel');
  totalTests++;
  if (checkValue(consoRefPCS, 64791.91, 'Conso ref PCS = 64791.91 kWh')) passedTests++;

  const consoSortie = calculConsoSortieChaudieresRef(consoRefCalculees, etatRef.rendementProduction);
  totalTests++;
  if (checkValue(consoSortie, 50066.48, 'Conso sortie chaudières = 50066.48 kWh')) passedTests++;

  // TEST 4: Bâtiment 1 - État initial
  console.log('\nTest 4: Bâtiment n°1 "Bâtiment 1" - État Initial');
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

  totalTests++;
  if (checkValue(calculRendementMoyen(etat1), 0.5832, 'Rendement moyen = 58.32%')) passedTests++;

  totalTests++;
  if (checkValue(calculConsoKWhep(etat1), 32000, 'Conso kWhep = 32000 kWh')) passedTests++;

  totalTests++;
  if (checkValue(calculConsoPCS(etat1), 31464, 'Conso PCS = 31464 kWh')) passedTests++;

  totalTests++;
  if (checkValue(calculCoutAnnuel(etat1), 4090.32, 'Coût annuel = 4090.32€')) passedTests++;

  // TEST 5: Chiffrage Parc 1
  console.log('\nTest 5: Chiffrage Référence Parc 1');

  const travauxChaufferie = [{ qte: 5, pu: 5000 }];
  const fraisAnnexesObj = {
    bureauControle: 0,
    maitriseOeuvre: 0.13,
    fraisDivers: 0.02,
    aleas: 0.05,
  };

  const sousTotalChaufferie = calculSousTotalChaufferie(travauxChaufferie);
  totalTests++;
  if (checkValue(sousTotalChaufferie, 25000, 'Sous-total chaufferie = 25000€')) passedTests++;

  const fraisAnnexes = calculFraisAnnexes(sousTotalChaufferie, fraisAnnexesObj);
  totalTests++;
  if (checkValue(fraisAnnexes, 5000, 'Frais annexes = 5000€')) passedTests++;

  const totalHT = calculTotalInvestissementHT(sousTotalChaufferie, fraisAnnexes);
  totalTests++;
  if (checkValue(totalHT, 30000, 'Total investissement HT = 30000€')) passedTests++;

  const tva = calculTVA(totalHT);
  totalTests++;
  if (checkValue(tva, 6000, 'TVA 20% = 6000€')) passedTests++;

  const totalTTC = calculTotalInvestissementTTC(totalHT);
  totalTests++;
  if (checkValue(totalTTC, 36000, 'Total TTC = 36000€')) passedTests++;

  const annuite = calculAnnuite(totalHT, 9118.96, 15);
  totalTests++;
  if (checkValue(annuite, 2607.93, 'Annuité = 2607.93€/an')) passedTests++;

  // TEST 6: Monotone de charge
  console.log('\nTest 6: Monotone de Charge');

  const deperditionsParDegre = calculDeperditionsParDegre(30000, 19, -7);
  totalTests++;
  if (checkValue(deperditionsParDegre, 1153.846, 'Déperditions par °C = 1153.846 W/°C')) passedTests++;

  const puissanceH1 = calculPuissanceAppeleePourTemp(deperditionsParDegre, 19, -4);
  const expectedH1 = 1153.846 * 23;
  totalTests++;
  if (checkValue(puissanceH1, expectedH1, 'Puissance H1 (T=-4°C) ≈ 26538.46W')) passedTests++;

  // Summary
  console.log('\n══════════════════════════════════════════════════');
  console.log(`Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('✓ ALL TESTS PASSED!');
    console.log('══════════════════════════════════════════════════\n');
    return true;
  } else {
    console.log(`✗ ${totalTests - passedTests} tests failed`);
    console.log('══════════════════════════════════════════════════\n');
    return false;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests };
