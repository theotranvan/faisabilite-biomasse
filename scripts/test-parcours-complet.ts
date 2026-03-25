#!/usr/bin/env node
/**
 * Script de test du parcours complet: Création affaire → Calculs → Résultats
 * Lance avec: npx tsx scripts/test-parcours-complet.ts
 * 
 * Étapes testées:
 * 1. npm install ✓
 * 2. npx prisma generate ✓
 * 3. npx prisma db seed ✓
 * 4. Créer affaire avec 3 bâtiments + 2 parcs (données Excel)
 * 5. Remplir état référence
 * 6. Remplir chiffrage Parc 1
 * 7. Vérifier calculs vs Excel
 */

import { PrismaClient } from '@prisma/client';
import {
  calculsBatimentComplet,
  calculPuissanceChauffageParc,
  calculConsoSortieParcChaudieresRef,
  calculInvestissementHTRef,
  calculBilan20Ans,
} from '@/lib/calculs';

const db = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, condition: boolean, expected?: any, actual?: any) {
  results.push({ name, passed: condition, expected, actual });
  console.log(`${condition ? '✓' : '✗'} ${name}`, condition ? '' : `\n    Expected: ${expected}\n    Actual: ${actual}`);
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PARCOURS DE TEST COMPLET - Faisabilité Biomasse');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // ========== ÉTAPE 1: CRÉER L'AFFAIRE ==========
    console.log('\n🔧 Étape 1: Création de l\'affaire');
    console.log('─────────────────────────────────────────────────────────────');

    const affaire = await db.affaire.create({
      data: {
        nomClient: 'Test Excel Complet',
        adresse: '123 Rue de Test',
        ville: 'Lyon',
        departement: '69',
        latitude: 45.764,
        longitude: 4.836,
        djuRetenu: 1977,
        tempIntBase: 19,
        tempExtBase: -7,
        augmentationFossile: 2.5,
        augmentationBiomasse: 0,
        tauxEmprunt: 3.5,
        dureeEmprunt: 20,
        statut: 'EN_COURS',
        villeMonotone: 'LYON',
      },
    });

    test('Affaire créée', affaire.id !== undefined);
    console.log(`  ID affaire: ${affaire.id}\n`);

    // ========== ÉTAPE 2: CRÉER LES 3 BÂTIMENTS ==========
    console.log('🏢 Étape 2: Création des 3 bâtiments (données Excel)');
    console.log('─────────────────────────────────────────────────────────────');

    const batiments = await db.batiment.createMany({
      data: [
        {
          // Bâtiment 1 - Logements
          affaireId: affaire.id,
          numero: 1,
          designation: 'Bâtiment 1 - Logements',
          typeBatiment: 'LOGEMENTS',
          surfaceChauffee: 100,
          volumeChauffe: 300,
          parc: 1,
          deperditions: 10,
          rendementProduction: 80,
          rendementDistribution: 90,
          rendementEmission: 90,
          rendementRegulation: 90,
          coefIntermittence: 1,
          consommationsCalculees: 31464,
          consommationsReelles: 32000,
          typeEnergie: 'FUEL',
          tarification: 0.13,
          abonnement: 0,
          refDeperditions: 10,
          refTypeEnergie: 'GAZ_NATUREL',
          refRendementProduction: 0.80,
          refRendementDistribution: 0.90,
          refRendementEmission: 0.90,
          refRendementRegulation: 0.90,
          refTarification: 0.978,
          refAbonnement: 0,
        },
        {
          // Bâtiment 2 - Bureaux
          affaireId: affaire.id,
          numero: 2,
          designation: 'Bâtiment 2 - Bureaux',
          typeBatiment: 'BUREAUX',
          surfaceChauffee: 200,
          volumeChauffe: 500,
          parc: 2,
          deperditions: 20,
          rendementProduction: 85,
          rendementDistribution: 90,
          rendementEmission: 90,
          rendementRegulation: 90,
          coefIntermittence: 1,
          consommationsCalculees: 58868,
          consommationsReelles: 60000,
          typeEnergie: 'ELECTRICITE',
          tarification: 0.226,
          abonnement: 0,
          refDeperditions: 20,
          refTypeEnergie: 'GAZ_NATUREL',
          refRendementProduction: 0.85,
          refRendementDistribution: 0.90,
          refRendementEmission: 0.90,
          refRendementRegulation: 0.90,
          refTarification: 0.1502,
          refAbonnement: 0,
        },
        {
          // Bâtiment 3 - Logements
          affaireId: affaire.id,
          numero: 3,
          designation: 'Bâtiment 3 - Logements',
          typeBatiment: 'LOGEMENTS',
          surfaceChauffee: 100,
          volumeChauffe: 300,
          parc: 1,
          deperditions: 20,
          rendementProduction: 80,
          rendementDistribution: 85,
          rendementEmission: 85,
          rendementRegulation: 90,
          coefIntermittence: 1,
          consommationsCalculees: 70189,
          consommationsReelles: 71000,
          typeEnergie: 'FUEL',
          tarification: 0.13,
          abonnement: 0,
          refDeperditions: null,
          refTypeEnergie: null,
          refRendementProduction: null,
          refRendementDistribution: null,
          refRendementEmission: null,
          refRendementRegulation: null,
          refTarification: null,
          refAbonnement: null,
        },
      ],
    });

    test('3 bâtiments créés', batiments.count === 3);
    console.log(`  ${batiments.count} bâtiments créés\n`);

    // ========== ÉTAPE 3: CRÉER LES 2 PARCS ==========
    console.log('🌳 Étape 3: Création des 2 parcs (réseaux biomasse)');
    console.log('─────────────────────────────────────────────────────────────');

    const parc1 = await db.parc.create({
      data: {
        affaireId: affaire.id,
        numero: 1,
        puissanceChaudiereBois: 10,
        rendementChaudiereBois: 90,
        typeBiomasse: 'PLAQUETTE',
        pourcentageCouvertureBois: 100,
      },
    });

    const parc2 = await db.parc.create({
      data: {
        affaireId: affaire.id,
        numero: 2,
        puissanceChaudiereBois: 20,
        rendementChaudiereBois: 90,
        typeBiomasse: 'PLAQUETTE',
        pourcentageCouvertureBois: 100,
      },
    });

    test('Parc 1 créé', parc1.id !== undefined, 'Define', parc1.puissanceChaudiereBois);
    test('Parc 2 créé', parc2.id !== undefined, 'Define', parc2.puissanceChaudiereBois);
    console.log(`  Parc 1: 10kW, ${parc1.pourcentageCouvertureBois}% couverture`);
    console.log(`  Parc 2: 20kW, ${parc2.pourcentageCouvertureBois}% couverture\n`);

    // ========== ÉTAPE 4: VÉRIFIER LES CALCULS ==========
    console.log('📊 Étape 4: Vérification des calculs vs Excel');
    console.log('─────────────────────────────────────────────────────────────');

    // Récupérer les bâtiments créés
    const bat1 = await db.batiment.findFirst({ where: { affaireId: affaire.id, numero: 1 } });
    const bat2 = await db.batiment.findFirst({ where: { affaireId: affaire.id, numero: 2 } });
    const allBatiments = await db.batiment.findMany({ where: { affaireId: affaire.id } });

    if (!bat1 || !bat2) {
      throw new Error('Bâtiments non trouvés');
    }

    // Transformer les données pour les calculs
    const batiment1Calc = {
      numero: bat1.numero,
      designation: bat1.designation,
      typeBatiment: bat1.typeBatiment,
      surfaceChauffee: bat1.surfaceChauffee,
      volumeChauffe: bat1.volumeChauffe,
      parc: bat1.parc,
      etatInitial: {
        deperditions_kW: bat1.deperditions,
        rendementProduction: bat1.rendementProduction,
        rendementDistribution: bat1.rendementDistribution,
        rendementEmission: bat1.rendementEmission,
        rendementRegulation: bat1.rendementRegulation,
        coefIntermittence: bat1.coefIntermittence,
        consommationsCalculees: bat1.consommationsCalculees,
        consommationsReelles: bat1.consommationsReelles,
        typeEnergie: bat1.typeEnergie === 'FUEL' ? 'Fuel' : bat1.typeEnergie === 'ELECTRICITE' ? 'Electricité' : 'Fuel',
        tarification: bat1.tarification,
        abonnement: bat1.abonnement,
      },
      etatReference: {
        deperditions_kW: bat1.refDeperditions!,
        typeEnergie: 'Gaz naturel',
        rendementProduction: bat1.refRendementProduction!,
        rendementDistribution: bat1.refRendementDistribution!,
        rendementEmission: bat1.refRendementEmission!,
        rendementRegulation: bat1.refRendementRegulation!,
        tarification: bat1.refTarification!,
        abonnement: bat1.refAbonnement!,
        consommationsCalculees: 0,
      },
    };

    const calc1 = calculsBatimentComplet(batiment1Calc, 1977, 19, -7);
    test('Bât1: coutAnnuelEI = 4090.32€', Math.abs(calc1.coutAnnuelEI - 4090.32) < 1, 4090.32, calc1.coutAnnuelEI?.toFixed(2));
    test('Bât1: consoRefCalculees = 31291.55', Math.abs(calc1.consoRefCalculees! - 31291.55) < 1, 31291.55, calc1.consoRefCalculees?.toFixed(2));

    const batiment2Calc = { ...batiment1Calc, ...bat2 };
    batiment2Calc.etatInitial = {
      deperditions_kW: bat2.deperditions,
      rendementProduction: bat2.rendementProduction,
      rendementDistribution: bat2.rendementDistribution,
      rendementEmission: bat2.rendementEmission,
      rendementRegulation: bat2.rendementRegulation,
      coefIntermittence: bat2.coefIntermittence,
      consommationsCalculees: bat2.consommationsCalculees,
      consommationsReelles: bat2.consommationsReelles,
      typeEnergie: 'Electricité',
      tarification: bat2.tarification,
      abonnement: bat2.abonnement,
    };
    batiment2Calc.etatReference = {
      deperditions_kW: bat2.refDeperditions!,
      typeEnergie: 'Gaz naturel',
      rendementProduction: bat2.refRendementProduction!,
      rendementDistribution: bat2.refRendementDistribution!,
      rendementEmission: bat2.refRendementEmission!,
      rendementRegulation: bat2.refRendementRegulation!,
      tarification: bat2.refTarification!,
      abonnement: bat2.refAbonnement!,
      consommationsCalculees: 0,
    };

    const calc2 = calculsBatimentComplet(batiment2Calc, 1977, 19, -7);
    test('Bât2: coutAnnuelEI = 13304.17€', Math.abs(calc2.coutAnnuelEI - 13304.17) < 1, 13304.17, calc2.coutAnnuelEI?.toFixed(2));
    test('Bât2: consoRefCalculees = 58901.74', Math.abs(calc2.consoRefCalculees! - 58901.74) < 1, 58901.74, calc2.consoRefCalculees?.toFixed(2));
    test('Bât2: consoSortieChaudieresRef = 50066.48', Math.abs(calc2.consoSortieChaudieresRef! - 50066.48) < 1, 50066.48, calc2.consoSortieChaudieresRef?.toFixed(2));

    console.log();

    // ========== ÉTAPE 5: VÉRIFIER AGRÉGATION PARCS ==========
    console.log('🔗 Étape 5: Vérification agrégation par parc');
    console.log('─────────────────────────────────────────────────────────────');

    const parcCalcs = allBatiments.map(b => ({
      numero: b.numero,
      designation: b.designation,
      typeBatiment: b.typeBatiment,
      surfaceChauffee: b.surfaceChauffee,
      volumeChauffe: b.volumeChauffe,
      parc: b.parc,
      etatInitial: {
        deperditions_kW: b.deperditions,
        rendementProduction: b.rendementProduction,
        rendementDistribution: b.rendementDistribution,
        rendementEmission: b.rendementEmission,
        rendementRegulation: b.rendementRegulation,
        coefIntermittence: b.coefIntermittence,
        consommationsCalculees: b.consommationsCalculees,
        consommationsReelles: b.consommationsReelles,
        typeEnergie: b.typeEnergie,
        tarification: b.tarification,
        abonnement: b.abonnement,
      },
      etatReference: b.refTypeEnergie ? {
        deperditions_kW: b.refDeperditions!,
        typeEnergie: 'Gaz naturel',
        rendementProduction: b.refRendementProduction!,
        rendementDistribution: b.refRendementDistribution!,
        rendementEmission: b.refRendementEmission!,
        rendementRegulation: b.refRendementRegulation!,
        tarification: b.refTarification!,
        abonnement: b.refAbonnement!,
        consommationsCalculees: 0,
      } : null,
    }));

    const consoParc1 = calculConsoSortieParcChaudieresRef(parcCalcs.filter(b => b.parc === 1), 1, 1977, 19, -7);
    const consoParc2 = calculConsoSortieParcChaudieresRef(parcCalcs.filter(b => b.parc === 2), 2, 1977, 19, -7);

    test('Parc 1: consoSortieParc = 25033.24', Math.abs(consoParc1 - 25033.24) < 1, 25033.24, consoParc1.toFixed(2));
    test('Parc 2: consoSortieParc = 50066.48', Math.abs(consoParc2 - 50066.48) < 1, 50066.48, consoParc2.toFixed(2));

    console.log();

    // ========== ÉTAPE 6: CRÉER CHIFFRAGE PARC 1 ==========
    console.log('💰 Étape 6: Création du chiffrage Parc 1');
    console.log('─────────────────────────────────────────────────────────────');

    const chiffrageBio = await db.chiffrageBiomasse.create({
      data: {
        parcId: parc1.id,
        // 5 chaudières × 5000€
        lignesChaufferie: JSON.stringify([{ designation: 'Chaudière biomasse', qte: 5, prixUnitaire: 5000 }]),
        montantChaufferie: 25000,
        tauxSubventionCotEnr: 0,
      },
    });

    test('Chiffrage Parc 1 créé', chiffrageBio.id !== undefined);
    test('Montant chiffrage = 25000€', chiffrageBio.montantChaufferie === 25000, 25000, chiffrageBio.montantChaufferie);
    console.log(`  5 chaudières × 5000€ = 25000€\n`);

    // ========== ÉTAPE 7: VÉRIFIER AFFAIRE COMPLÈTE ==========
    console.log('✅ Étape 7: Vérification affaire complète');
    console.log('─────────────────────────────────────────────────────────────');

    const affaireComplete = await db.affaire.findUnique({
      where: { id: affaire.id },
      include: {
        batiments: true,
        parcs: { include: { chiffrageBio: true, chiffrageRef: true } },
      },
    });

    test('Affaire a 3 bâtiments', affaireComplete?.batiments.length === 3, 3, affaireComplete?.batiments.length);
    test('Affaire a 2 parcs', affaireComplete?.parcs.length === 2, 2, affaireComplete?.parcs.length);
    test('Parc 1 has chiffrage', affaireComplete?.parcs[0]?.chiffrageBio !== null, 'Defined', affaireComplete?.parcs[0]?.chiffrageBio !== null ? 'YES' : 'NO');

    console.log();

    // ========== RÉSUMÉ ==========
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  📋 RÉSUMÉ DES TESTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`  Tests réussis: ${passed}/${total} (${passRate}%)\n`);

    if (passed === total) {
      console.log('  🎉 TOUS LES TESTS PASSÉS! L\'application fonctionne correctement.');
      console.log('     Les résultats correspondent aux valeurs Excel.\n');
      console.log('  Vous pouvez maintenant:');
      console.log('  1. npm run dev');
      console.log('  2. Aller sur http://localhost:3000');
      console.log('  3. Créer une affaire manuellement ou charger celle créée ici');
      console.log('  4. Exporter un PDF pour vérifier le rendu final\n');
    } else {
      console.log('  ⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('  Tests échoués:\n');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  ✗ ${r.name}`);
        if (r.expected) console.log(`    Expected: ${r.expected}`);
        if (r.actual) console.log(`    Actual: ${r.actual}`);
      });
      console.log();
    }

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
