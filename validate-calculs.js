/**
 * Quick validation test - JavaScript version
 * Runs calculation tests without TypeScript compilation
 */

// Tolerance for floating-point comparisons
const TOLERANCE = 0.001;

function checkValue(actual, expected, label) {
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

// ============ CALCULATION FUNCTIONS ============

function calculRendementMoyen(etat) {
  const rp = etat.rendementProduction / 100;
  const rd = etat.rendementDistribution / 100;
  const re = etat.rendementEmission / 100;
  const rr = etat.rendementRegulation / 100;
  return rp * rd * re * rr;
}

function calculConsoKWhep(etat) {
  const conso = etat.consommationsReelles || etat.consommationsCalculees;
  if (etat.typeEnergie === 'Electricité' || etat.typeEnergie === 'Electricity') {
    return conso * 2.3;
  }
  return conso;
}

function calculConsoPCS(etat) {
  if (etat.typeEnergie === 'Gaz naturel' || etat.typeEnergie === 'Gaz propane' || 
      etat.typeEnergie === 'Natural gas' || etat.typeEnergie === 'Propane') {
    return etat.consommationsCalculees * 1.1;
  }
  return etat.consommationsCalculees;
}

function calculCoutAnnuel(etat) {
  const consoPCS = calculConsoPCS(etat);
  return etat.abonnement + (consoPCS * etat.tarification);
}

function calculConsoRefCalculees(deperditions_kW, DJU, tempInt, tempExt, rendementMoyenRef, coefIntermittence = 1) {
  const deltaT = tempInt - tempExt;
  if (deltaT <= 0 || rendementMoyenRef <= 0) return 0;
  
  const numerator = deperditions_kW * 1000 * DJU * 24;
  const denominator = deltaT * rendementMoyenRef * 1000;
  
  return (numerator / denominator) * coefIntermittence;
}

function calculConsoRefPCS(consoRefCalculees, energyType) {
  if (energyType === 'Gaz naturel' || energyType === 'Gaz propane' || 
      energyType === 'Natural gas' || energyType === 'Propane') {
    return consoRefCalculees * 1.1;
  }
  return consoRefCalculees;
}

function calculConsoSortieChaudieresRef(consoRefCalculees, rendementProduction) {
  return consoRefCalculees * rendementProduction;
}

function calculSousTotalChaufferie(travauxChaufferie) {
  return travauxChaufferie.reduce((sum, item) => sum + item.qte * item.pu, 0);
}

function calculFraisAnnexes(sousTotalChaufferie, fraisAnnexesRates) {
  const totalRates =
    (fraisAnnexesRates.bureauControle || 0) +
    (fraisAnnexesRates.maitriseOeuvre || 0) +
    (fraisAnnexesRates.fraisDivers || 0) +
    (fraisAnnexesRates.aleas || 0);

  return sousTotalChaufferie * totalRates;
}

function calculTotalInvestissementHT(sousTotalChaufferie, fraisAnnexes) {
  return sousTotalChaufferie + fraisAnnexes;
}

function calculTVA(totalInvestissementHT) {
  return totalInvestissementHT * 0.2;
}

function calculTotalInvestissementTTC(totalInvestissementHT) {
  return totalInvestissementHT * 1.2;
}

function calculAnnuite(investissementHT, emprunt, dureeEmprunt) {
  const montantTotal = investissementHT + (emprunt || 0);
  return montantTotal / dureeEmprunt;
}

function calculDeperditionsParDegre(deperditionsTotales_W, tempIntBase, tempExtBase) {
  const deltaT = tempIntBase - tempExtBase;
  if (deltaT <= 0) return 0;
  return deperditionsTotales_W / deltaT;
}

function calculPuissanceAppeleePourTemp(deperditionsParDegre, tempInt, temp) {
  if (temp < tempInt) {
    return deperditionsParDegre * (tempInt - temp);
  }
  return 0;
}

// ============ RUN TESTS ============

function runTests() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('   VALIDATION TEST - Calculs Faisabilité Biomasse');
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

  const rendementMoyenRef = etatRef.rendementProduction * etatRef.rendementDistribution * etatRef.rendementEmission * etatRef.rendementRegulation;
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
  console.log(`Résultats: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('✓ ALL TESTS PASSED! ✓');
    console.log('══════════════════════════════════════════════════\n');
    return true;
  } else {
    console.log(`✗ ${totalTests - passedTests} tests failed`);
    console.log('══════════════════════════════════════════════════\n');
    return false;
  }
}

// Run tests
runTests();
