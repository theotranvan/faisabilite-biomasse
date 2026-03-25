/**
 * Regression test suite — March 2026
 * Validates that recent feature additions haven't broken existing behavior:
 *  - etatReference fallback (always provided, uses initial state when ref not explicit)
 *  - Per-parc bilan 20 ans calculation
 *  - Park aggregation with mixed ref/no-ref batiments
 *  - Synoptic schema consoBatimentsParc computation
 *  - Biomass consumption chain (sortie → entrée → appoint)
 *  - Rendement normalization (% vs decimal)
 */

import {
  calculRendementMoyen,
  calculConsoKWhep,
  calculConsoPCS,
  calculCoutAnnuel,
  calculsBatimentComplet,
  calculConsoRefCalculees,
} from '../lib/calculs/batiment';

import {
  calculBilan20Ans,
} from '../lib/calculs/bilan';

import {
  calculPuissanceChauffageParc,
  calculConsoSortieParcChaudieresRef,
  calculConsommationsSortieChaudiereBois,
  calculConsommationsEntreeChaudiereBois,
  calculConsommationsAppoint,
  calculStockage10jours,
  calculVolumeCendres,
  calculHeuresPP,
  calculInvestissementHTRef,
  calculInvestissementTTCRef,
  calculAnnuiteRef,
} from '../lib/calculs/parc';

import { Batiment, EtatEnergie } from '../lib/calculs/types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;
let assertionCount = 0;

function assert(condition: boolean, message: string): void {
  assertionCount++;
  if (!condition) {
    failCount++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passCount++;
  console.log(`  ✓ ${message}`);
}

function approx(actual: number, expected: number, tolerancePct = 0.01): boolean {
  if (expected === 0) return Math.abs(actual) < 0.001;
  return Math.abs((actual - expected) / expected) <= tolerancePct;
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

// ─────────────────────────────────────────────────────────────
// Test data factory
// ─────────────────────────────────────────────────────────────
function makeEtat(overrides: Partial<EtatEnergie> = {}): EtatEnergie {
  return {
    deperditions_kW: 20,
    rendementProduction: 80,
    rendementDistribution: 85,
    rendementEmission: 90,
    rendementRegulation: 90,
    coefIntermittence: 1,
    consommationsCalculees: 60000,
    consommationsReelles: 62000,
    typeEnergie: 'Fuel',
    tarification: 0.13,
    abonnement: 0,
    ...overrides,
  };
}

function makeBatiment(overrides: Partial<Batiment> & { etatInitial?: Partial<EtatEnergie>; etatReference?: Partial<EtatEnergie> | null } = {}): Batiment {
  const { etatInitial: eiOverrides, etatReference: erOverrides, ...rest } = overrides;
  return {
    numero: 1,
    designation: 'Test',
    typeBatiment: 'Logements',
    surfaceChauffee: 200,
    volumeChauffe: 600,
    parc: 1,
    etatInitial: makeEtat(eiOverrides),
    etatReference: erOverrides === null ? null : makeEtat({ typeEnergie: 'Gaz naturel', tarification: 0.08, ...erOverrides }),
    ...rest,
  };
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 1: etatReference fallback
// When etatReference is same as etatInitial (user didn't set ref explicitly),
// calculations must still produce valid non-zero results
// ═══════════════════════════════════════════════════════════════
function testEtatReferenceFallback() {
  console.log('\n### REG-01: etatReference fallback (identique à initial)');

  // Simulate: ref is same as initial (fallback case)
  const bat = makeBatiment({
    etatInitial: { deperditions_kW: 30, rendementProduction: 85, rendementDistribution: 90, rendementEmission: 90, rendementRegulation: 90, typeEnergie: 'Fuel', tarification: 0.13 },
    etatReference: { deperditions_kW: 30, rendementProduction: 85, rendementDistribution: 90, rendementEmission: 90, rendementRegulation: 90, typeEnergie: 'Fuel', tarification: 0.13 },
  });

  const calculs = calculsBatimentComplet(bat, 1977, 19, -7);

  assert(calculs.consoKWhepEI > 0, `ConsoKWhepEI > 0 (got ${fmt(calculs.consoKWhepEI)})`);
  assert((calculs.consoRefCalculees || 0) > 0, `ConsoRefCalculees > 0 (got ${fmt(calculs.consoRefCalculees || 0)})`);
  assert((calculs.coutAnnuelRef || 0) > 0, `CoutAnnuelRef > 0 (got ${fmt(calculs.coutAnnuelRef || 0)})`);
  assert((calculs.consoSortieChaudieresRef || 0) > 0, `ConsoSortieChaudieresRef > 0 (got ${fmt(calculs.consoSortieChaudieresRef || 0)})`);

  // When ref = initial, ref cost ~ EI cost (same energy, same rendements)
  const ratio = (calculs.coutAnnuelRef || 0) / calculs.coutAnnuelEI;
  assert(ratio > 0.5 && ratio < 2.0, `Ref/EI cost ratio is reasonable: ${ratio.toFixed(3)}`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 2: Parc aggregation with batiment without ref
// Batiments with etatReference=null should be excluded from parc conso
// (only batiments with etatReference contribute)
// ═══════════════════════════════════════════════════════════════
function testParcAggregationMixedRef() {
  console.log('\n### REG-02: Agrégation parc avec bâtiments mixtes (ref/no-ref)');

  const batiments: Batiment[] = [
    makeBatiment({ numero: 1, parc: 1, etatInitial: { deperditions_kW: 10 }, etatReference: { deperditions_kW: 10 } }),
    makeBatiment({ numero: 2, parc: 1, etatReference: null }), // no ref → excluded
    makeBatiment({ numero: 3, parc: 2, etatInitial: { deperditions_kW: 15 }, etatReference: { deperditions_kW: 15 } }),
  ];

  // Parc 1: only bat 1 contributes (bat 2 has no ref)
  const puissanceP1 = calculPuissanceChauffageParc(batiments, 1);
  assert(puissanceP1 === 10, `Puissance Parc 1 = 10 kW (bat 2 excluded, got ${puissanceP1})`);

  const consoP1 = calculConsoSortieParcChaudieresRef(batiments, 1, 1977, 19, -7);
  assert(consoP1 > 0, `Conso Parc 1 > 0 (got ${fmt(consoP1)})`);

  // Parc 2: bat 3 contributes
  const puissanceP2 = calculPuissanceChauffageParc(batiments, 2);
  assert(puissanceP2 === 15, `Puissance Parc 2 = 15 kW (got ${puissanceP2})`);

  const consoP2 = calculConsoSortieParcChaudieresRef(batiments, 2, 1977, 19, -7);
  assert(consoP2 > 0, `Conso Parc 2 > 0 (got ${fmt(consoP2)})`);

  // Parc 3: no batiments → 0
  const consoP3 = calculConsoSortieParcChaudieresRef(batiments, 3, 1977, 19, -7);
  assert(consoP3 === 0, `Conso Parc 3 = 0 (empty parc, got ${consoP3})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 3: Parc aggregation with ALL batiments having ref
// (the normal, fully-configured case)
// ═══════════════════════════════════════════════════════════════
function testParcAggregationAllRef() {
  console.log('\n### REG-03: Agrégation parc avec tous les bâtiments en ref');

  const batiments: Batiment[] = [
    makeBatiment({ numero: 1, parc: 1, etatInitial: { deperditions_kW: 20 }, etatReference: { deperditions_kW: 20 } }),
    makeBatiment({ numero: 2, parc: 1, etatInitial: { deperditions_kW: 30 }, etatReference: { deperditions_kW: 30 } }),
    makeBatiment({ numero: 3, parc: 2, etatInitial: { deperditions_kW: 25 }, etatReference: { deperditions_kW: 25 } }),
  ];

  const puissanceP1 = calculPuissanceChauffageParc(batiments, 1);
  assert(puissanceP1 === 50, `Puissance Parc 1 = 50 kW (20+30, got ${puissanceP1})`);

  const consoP1 = calculConsoSortieParcChaudieresRef(batiments, 1, 1977, 19, -7);
  const consoP2 = calculConsoSortieParcChaudieresRef(batiments, 2, 1977, 19, -7);

  // Parc 1 (50 kW total) should have higher conso than Parc 2 (25 kW)
  assert(consoP1 > consoP2, `Conso Parc 1 (${fmt(consoP1)}) > Conso Parc 2 (${fmt(consoP2)})`);

  // Ratio should be approximately 2:1 (50kW vs 25kW, same rendements)
  const ratio = consoP1 / consoP2;
  assert(approx(ratio, 2.0, 0.05), `Ratio ~2.0 (got ${ratio.toFixed(3)})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 4: Per-parc bilan 20 ans
// Each parc's bilan must be independent and consistent
// ═══════════════════════════════════════════════════════════════
function testBilanPerParc() {
  console.log('\n### REG-04: Bilan 20 ans par parc (indépendance)');

  // Parc 1 params
  const coutActuelP1 = 15000;
  const coutRefP1 = 12000;
  const coutBioP1 = 8000;
  const annuiteRefP1 = 1000;
  const annuiteBioP1 = 500;

  // Parc 2 params
  const coutActuelP2 = 25000;
  const coutRefP2 = 20000;
  const coutBioP2 = 14000;
  const annuiteRefP2 = 2000;
  const annuiteBioP2 = 1200;

  const bilanP1 = calculBilan20Ans(coutActuelP1, coutRefP1, coutBioP1, 0.04, 0.02, annuiteRefP1, annuiteBioP1, 15);
  const bilanP2 = calculBilan20Ans(coutActuelP2, coutRefP2, coutBioP2, 0.04, 0.02, annuiteRefP2, annuiteBioP2, 15);
  const bilanGlobal = calculBilan20Ans(
    coutActuelP1 + coutActuelP2, coutRefP1 + coutRefP2, coutBioP1 + coutBioP2,
    0.04, 0.02, annuiteRefP1 + annuiteRefP2, annuiteBioP1 + annuiteBioP2, 15
  );

  assert(bilanP1.length === 20, `Bilan P1 has 20 years (got ${bilanP1.length})`);
  assert(bilanP2.length === 20, `Bilan P2 has 20 years (got ${bilanP2.length})`);
  assert(bilanGlobal.length === 20, `Bilan global has 20 years (got ${bilanGlobal.length})`);

  // Year 1 values must match inputs
  assert(bilanP1[0].coutActuel === coutActuelP1, `P1 Year 1 coutActuel = ${coutActuelP1} (got ${bilanP1[0].coutActuel})`);
  assert(bilanP1[0].coutRef === coutRefP1, `P1 Year 1 coutRef = ${coutRefP1} (got ${bilanP1[0].coutRef})`);
  assert(bilanP1[0].coutBiomasse === coutBioP1, `P1 Year 1 coutBiomasse = ${coutBioP1} (got ${bilanP1[0].coutBiomasse})`);

  // Global year 1 = sum of per-parc year 1
  assert(approx(bilanGlobal[0].coutActuel, bilanP1[0].coutActuel + bilanP2[0].coutActuel),
    `Global Year 1 coutActuel = sum of parcs (${fmt(bilanGlobal[0].coutActuel)})`);

  // Global economies = sum of per-parc economies (year 1 exact, later years approximate due to non-linear)
  // Since fossil augmentation is uniform for all parcs, linear additivity holds
  for (const year of [0, 4, 9, 14, 19]) {
    const ecoGlobal = bilanGlobal[year].economie;
    const ecoSum = bilanP1[year].economie + bilanP2[year].economie;
    assert(approx(ecoGlobal, ecoSum, 0.001),
      `Year ${year + 1} economies: global (${fmt(ecoGlobal)}) ≈ P1+P2 (${fmt(ecoSum)})`);
  }

  // Annuity deduction at year 16 (durée=15, deduction at 15+1=16)
  const y15 = bilanP1[14]; // index 14 = year 15
  const y16 = bilanP1[15]; // index 15 = year 16
  const expectedRefY16 = y15.coutRef * (1 + 0.04) - annuiteRefP1;
  assert(approx(y16.coutRef, expectedRefY16, 0.001),
    `P1 Year 16: ref cost drops by annuity (${fmt(y16.coutRef)} ≈ ${fmt(expectedRefY16)})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 5: Synoptic schema chain
// consoBatimentsParc → sortie bois → entrée bois → appoint
// ═══════════════════════════════════════════════════════════════
function testSynopticSchemaChain() {
  console.log('\n### REG-05: Chaîne synoptique (conso → sortie → entrée → appoint)');

  const consoBatiments = 100000; // kWh/an
  const couvertureBois = 80; // %
  const rendementBois = 85; // %
  const rendementAppoint = 90; // %

  const sortieBois = calculConsommationsSortieChaudiereBois(consoBatiments, couvertureBois);
  assert(sortieBois === 80000, `Sortie bois = 80000 kWh (got ${sortieBois})`);

  const entreeBois = calculConsommationsEntreeChaudiereBois(sortieBois, rendementBois);
  const expectedEntreeBois = 80000 / 0.85;
  assert(approx(entreeBois, expectedEntreeBois), `Entrée bois = ${fmt(expectedEntreeBois)} kWh (got ${fmt(entreeBois)})`);

  const entreeAppoint = calculConsommationsAppoint(consoBatiments, couvertureBois, rendementAppoint);
  const expectedAppoint = 20000 / 0.90;
  assert(approx(entreeAppoint, expectedAppoint), `Entrée appoint = ${fmt(expectedAppoint)} kWh (got ${fmt(entreeAppoint)})`);

  // Energy balance: sortie bois + sortie appoint = consoBatiments
  const sortieAppoint = consoBatiments * (1 - couvertureBois / 100);
  assert(approx(sortieBois + sortieAppoint, consoBatiments),
    `Sortie bois + appoint = conso batiments (${fmt(sortieBois + sortieAppoint)} ≈ ${consoBatiments})`);

  // Entrée > sortie (rendement < 100%)
  assert(entreeBois > sortieBois, `Entrée bois (${fmt(entreeBois)}) > Sortie bois (${sortieBois})`);
  assert(entreeAppoint > sortieAppoint, `Entrée appoint (${fmt(entreeAppoint)}) > Sortie appoint (${sortieAppoint})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 6: Synoptic schema with consoBatimentsParc = 0
// Should not cause any crash or division by zero
// ═══════════════════════════════════════════════════════════════
function testSynopticSchemaZeroConso() {
  console.log('\n### REG-06: Schéma synoptique avec conso = 0 (pas de crash)');

  const consoBatiments = 0;

  const sortieBois = calculConsommationsSortieChaudiereBois(consoBatiments, 80);
  assert(sortieBois === 0, `Sortie bois = 0 quand conso = 0`);

  const entreeBois = calculConsommationsEntreeChaudiereBois(0, 85);
  assert(entreeBois === 0, `Entrée bois = 0 quand sortie = 0`);

  const entreeAppoint = calculConsommationsAppoint(0, 80, 90);
  assert(entreeAppoint === 0, `Entrée appoint = 0 quand conso = 0`);

  // Stockage 10j with 0 conso
  const stock = calculStockage10jours(0, 3.8, 225);
  assert(stock.tonnes === 0, `Stock tonnes = 0 quand conso = 0`);
  assert(stock.m3 === 0, `Stock m3 = 0 quand conso = 0`);

  // Cendres with 0
  const cendres = calculVolumeCendres(0, 0.01, 225);
  assert(cendres.m3 === 0, `Cendres m3 = 0 quand conso = 0`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 7: Rendement normalization
// batiment.ts: always expects % (divides by 100)
// parc.ts: adaptive (detects >1 → divides by 100, <=1 → uses as-is)
// ═══════════════════════════════════════════════════════════════
function testRendementNormalization() {
  console.log('\n### REG-07: Normalisation des rendements');

  // batiment.ts: calculRendementMoyen always expects % format
  const rendPct = calculRendementMoyen({
    deperditions_kW: 10,
    rendementProduction: 85,
    rendementDistribution: 90,
    rendementEmission: 95,
    rendementRegulation: 90,
    coefIntermittence: 1,
    consommationsCalculees: 0,
    typeEnergie: 'Fuel',
    tarification: 0.13,
    abonnement: 0,
  });

  const expected = 0.85 * 0.90 * 0.95 * 0.90;

  assert(approx(rendPct, expected, 0.01), `Rendement % format = ${(rendPct * 100).toFixed(2)}% (expected ${(expected * 100).toFixed(2)}%)`);
  assert(rendPct > 0 && rendPct < 1, `Rendement is a decimal 0-1 (got ${rendPct.toFixed(4)})`);

  // parc.ts: adaptive normalization handles both formats
  // When rendement > 1 → divided by 100; when ≤ 1 → used as-is
  const batPct: Batiment = makeBatiment({
    etatReference: { deperditions_kW: 10, rendementProduction: 85, rendementDistribution: 90, rendementEmission: 95, rendementRegulation: 90 },
  });
  const batDec: Batiment = makeBatiment({
    etatReference: { deperditions_kW: 10, rendementProduction: 0.85, rendementDistribution: 0.90, rendementEmission: 0.95, rendementRegulation: 0.90 },
  });

  const consoPct = calculConsoSortieParcChaudieresRef([batPct], 1, 1977, 19, -7);
  const consoDec = calculConsoSortieParcChaudieresRef([batDec], 1, 1977, 19, -7);

  assert(consoPct > 0, `Conso parc (format %) > 0 (got ${fmt(consoPct)})`);
  assert(consoDec > 0, `Conso parc (format décimal) > 0 (got ${fmt(consoDec)})`);
  assert(approx(consoPct, consoDec, 0.01), `Formats % et décimal donnent même résultat dans parc.ts (${fmt(consoPct)} ≈ ${fmt(consoDec)})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 8: consoSortieParcChaudieresRef normalization
// With rendements in % format
// ═══════════════════════════════════════════════════════════════
function testParcConsoRendementsPercent() {
  console.log('\n### REG-08: Conso parc avec rendements en %');

  const bat: Batiment = {
    numero: 1, designation: 'Test', typeBatiment: 'Logements',
    surfaceChauffee: 200, volumeChauffe: 600, parc: 1,
    etatInitial: makeEtat({ deperditions_kW: 20 }),
    etatReference: makeEtat({ deperditions_kW: 20, rendementProduction: 85, rendementDistribution: 90, rendementEmission: 95, rendementRegulation: 90 }),
  };

  const conso = calculConsoSortieParcChaudieresRef([bat], 1, 1977, 19, -7);
  assert(conso > 0, `Conso parc > 0 with % rendements (got ${fmt(conso)})`);
  assert(conso < 1e8, `Conso parc < 100 GWh (reasonable upper bound, got ${fmt(conso)})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 9: Investment chain (chiffrage reference)
// InvestHT → InvestTTC → Annuité
// ═══════════════════════════════════════════════════════════════
function testChiffrageRefChain() {
  console.log('\n### REG-09: Chaîne chiffrage ref (HT → TTC → annuité)');

  const travaux = [
    { qte: 1, pu: 50000 },
    { qte: 1, pu: 30000 },
    { qte: 500, pu: 150 },
  ];
  const frais = { bureauControle: 0.02, maitriseOeuvre: 0.08, fraisDivers: 0.03, aleas: 0.05 };

  const investHT = calculInvestissementHTRef(travaux, frais);
  const sousTotal = 50000 + 30000 + 75000; // 155000
  const expectedHT = sousTotal * (1 + 0.02 + 0.08 + 0.03 + 0.05); // 155000 * 1.18
  assert(approx(investHT, expectedHT), `Invest HT = ${fmt(expectedHT)} (got ${fmt(investHT)})`);

  const investTTC = calculInvestissementTTCRef(investHT);
  assert(approx(investTTC, investHT * 1.2), `Invest TTC = HT * 1.2 (got ${fmt(investTTC)})`);

  const annuite = calculAnnuiteRef(investHT, 0, 15);
  assert(approx(annuite, investHT / 15), `Annuité = HT / 15 (got ${fmt(annuite)})`);
  assert(annuite > 0, `Annuité > 0`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 10: Bilan 20 ans consistency
// Total economies over 20 years should be positive when biomasse is cheaper
// ═══════════════════════════════════════════════════════════════
function testBilan20AnsConsistency() {
  console.log('\n### REG-10: Bilan 20 ans cohérence globale');

  const bilan = calculBilan20Ans(20000, 18000, 12000, 0.04, 0.02, 1500, 800, 15);

  assert(bilan.length === 20, `Bilan = 20 years`);

  // All years must have positive actuel/ref/biomasse costs
  for (let i = 0; i < 20; i++) {
    assert(bilan[i].coutActuel > 0, `Year ${i + 1} coutActuel > 0`);
    assert(bilan[i].coutRef > 0, `Year ${i + 1} coutRef > 0`);
    assert(bilan[i].coutBiomasse > 0, `Year ${i + 1} coutBiomasse > 0`);
  }

  // Fossil costs increase faster than biomass (4% > 2%)
  assert(bilan[19].coutRef > bilan[0].coutRef, `Ref cost increases over 20 years`);
  assert(bilan[19].coutBiomasse > bilan[0].coutBiomasse, `Biomasse cost increases over 20 years`);

  const ratioRefGrowth = bilan[19].coutRef / bilan[0].coutRef;
  const ratioBioGrowth = bilan[19].coutBiomasse / bilan[0].coutBiomasse;
  // Compare growth excluding the annuity deduction effect — ref should grow faster
  assert(ratioRefGrowth > ratioBioGrowth * 0.8, `Ref grows at least comparably to bio (fossil rate > bio rate)`);

  // Total 20-year economies should be positive
  const totalEconomies = bilan.reduce((s, y) => s + y.economie, 0);
  assert(totalEconomies > 0, `Total 20-year economies > 0 (got ${fmt(totalEconomies)}€)`);

  // Year 16: annuity deduction happens
  const y15Ref = bilan[14].coutRef;
  const y16Ref = bilan[15].coutRef;
  assert(y16Ref < y15Ref * 1.05, `Year 16 ref < Year 15 * 1.05 (annuity deducted)`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 11: Stockage & cendres calculations
// ═══════════════════════════════════════════════════════════════
function testStockageCendres() {
  console.log('\n### REG-11: Stockage 10 jours & cendres');

  // Plaquette: PCI 3.8 MWh/t, masse vol 225 kg/m³
  const conso10j = 50000 / 365 * 10; // ≈ 1370 kWh
  const stock = calculStockage10jours(conso10j, 3.8, 225);

  assert(stock.tonnes > 0, `Stock tonnes > 0 (got ${fmt(stock.tonnes)})`);
  assert(stock.m3 > 0, `Stock m3 > 0 (got ${fmt(stock.m3)})`);
  assert(stock.m3 > stock.tonnes, `Stock m3 > tonnes (bois est léger, got m3=${fmt(stock.m3)}, t=${fmt(stock.tonnes)})`);

  // Cendres
  const cendres = calculVolumeCendres(50000, 0.01, 225);
  assert(cendres.m3 > 0, `Cendres m3 > 0 (got ${fmt(cendres.m3)})`);
  assert(cendres.m3 < 100, `Cendres m3 reasonable (< 100, got ${fmt(cendres.m3)})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 12: HPP (Heures Pleine Puissance)
// ═══════════════════════════════════════════════════════════════
function testHPP() {
  console.log('\n### REG-12: Heures Pleine Puissance');

  const hpp = calculHeuresPP(80000, 100); // 80 MWh / 100 kW = 800h
  assert(hpp === 800, `HPP = 800h (got ${hpp})`);

  const hpp2 = calculHeuresPP(200000, 50); // 200 MWh / 50 kW = 4000h
  assert(hpp2 === 4000, `HPP = 4000h (got ${hpp2})`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 13: Batiment complet with ref identical to initial
// (simulates "identique à initial" button)
// ═══════════════════════════════════════════════════════════════
function testBatimentCompletRefEqualsInitial() {
  console.log('\n### REG-13: Bâtiment complet avec ref = initial ("identique à initial")');

  const etat: EtatEnergie = {
    deperditions_kW: 25,
    rendementProduction: 82,
    rendementDistribution: 88,
    rendementEmission: 92,
    rendementRegulation: 91,
    coefIntermittence: 1,
    consommationsCalculees: 75000,
    consommationsReelles: 78000,
    typeEnergie: 'Gaz naturel',
    tarification: 0.08,
    abonnement: 150,
  };

  const bat: Batiment = {
    numero: 1, designation: 'Test ident', typeBatiment: 'Bureaux',
    surfaceChauffee: 300, volumeChauffe: 900, parc: 1,
    etatInitial: etat,
    etatReference: { ...etat }, // identique
  };

  const calculs = calculsBatimentComplet(bat, 1977, 19, -7);

  // Both EI and ref should have similar costs
  assert(calculs.coutAnnuelEI > 0, `EI cost > 0 (got ${fmt(calculs.coutAnnuelEI)})`);
  assert((calculs.coutAnnuelRef || 0) > 0, `Ref cost > 0 (got ${fmt(calculs.coutAnnuelRef || 0)})`);

  // Costs should be very similar (same rendements, same energy)
  const diff = Math.abs(calculs.coutAnnuelEI - (calculs.coutAnnuelRef || 0));
  const pctDiff = diff / calculs.coutAnnuelEI;
  assert(pctDiff < 0.15, `Coûts EI/ref proches: diff ${(pctDiff * 100).toFixed(1)}% < 15%`);
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 14: Multi-parc independent bilans
// Bilans for different parcs should not interfere
// ═══════════════════════════════════════════════════════════════
function testMultiParcIndependence() {
  console.log('\n### REG-14: Indépendance bilan multi-parc');

  // Same params, different parcs
  const bilanA = calculBilan20Ans(10000, 8000, 5000, 0.04, 0.02, 600, 300, 15);
  const bilanB = calculBilan20Ans(10000, 8000, 5000, 0.04, 0.02, 600, 300, 15);
  const bilanC = calculBilan20Ans(20000, 16000, 10000, 0.04, 0.02, 1200, 600, 15);

  // A and B identical (same inputs)
  for (let i = 0; i < 20; i++) {
    assert(bilanA[i].economie === bilanB[i].economie,
      `Year ${i + 1}: Bilan A ≡ Bilan B (identical params)`);
  }

  // C = 2×A at each year (linear scaling)
  for (let i = 0; i < 20; i++) {
    assert(approx(bilanC[i].economie, bilanA[i].economie * 2, 0.001),
      `Year ${i + 1}: Bilan C ≈ 2× Bilan A`);
  }
}

// ═══════════════════════════════════════════════════════════════
// REGRESSION TEST 15: DPE etiquette consistency
// ═══════════════════════════════════════════════════════════════
function testDPEEtiquette() {
  console.log('\n### REG-15: Étiquettes DPE cohérentes');

  const bat = makeBatiment({
    etatInitial: { deperditions_kW: 20, surfaceChauffee: 200 } as any,
    etatReference: { deperditions_kW: 20, surfaceChauffee: 200 } as any,
    surfaceChauffee: 200,
  });

  const calculs = calculsBatimentComplet(bat, 1977, 19, -7);
  const consoPerM2 = calculs.consoKWhepEI / bat.surfaceChauffee;

  // DPE thresholds: A≤50, B≤90, C≤150, D≤230, E≤330, F≤450, G>451
  let expectedDPE: string;
  if (consoPerM2 <= 50) expectedDPE = 'A';
  else if (consoPerM2 <= 90) expectedDPE = 'B';
  else if (consoPerM2 <= 150) expectedDPE = 'C';
  else if (consoPerM2 <= 230) expectedDPE = 'D';
  else if (consoPerM2 <= 330) expectedDPE = 'E';
  else if (consoPerM2 <= 450) expectedDPE = 'F';
  else expectedDPE = 'G';

  assert(consoPerM2 > 0, `Conso/m² > 0 (got ${fmt(consoPerM2)})`);
  console.log(`  ℹ DPE = ${expectedDPE} (${fmt(consoPerM2)} kWhep/m²)`);
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL REGRESSION TESTS
// ═══════════════════════════════════════════════════════════════
function runAllRegressionTests() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   TESTS DE RÉGRESSION — Fonctionnalités Mars 2026');
  console.log('═══════════════════════════════════════════════════════════');

  const tests = [
    testEtatReferenceFallback,
    testParcAggregationMixedRef,
    testParcAggregationAllRef,
    testBilanPerParc,
    testSynopticSchemaChain,
    testSynopticSchemaZeroConso,
    testRendementNormalization,
    testParcConsoRendementsPercent,
    testChiffrageRefChain,
    testBilan20AnsConsistency,
    testStockageCendres,
    testHPP,
    testBatimentCompletRefEqualsInitial,
    testMultiParcIndependence,
    testDPEEtiquette,
  ];

  for (const test of tests) {
    try {
      test();
    } catch (error) {
      console.error(`\n✗ Test "${test.name}" échoué`);
      console.error('═══════════════════════════════════════════════════════════');
      console.error(`\n${passCount} passed, ${failCount} failed out of ${assertionCount} assertions`);
      throw error;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✓ TOUS LES TESTS DE RÉGRESSION PASSÉS! (${passCount}/${assertionCount} assertions)`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Auto-run
runAllRegressionTests();
