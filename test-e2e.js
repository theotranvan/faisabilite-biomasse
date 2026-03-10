// Comprehensive E2E test after all fixes
const BASE = 'http://localhost:3001';

async function test() {
  let passed = 0, failed = 0;
  
  function ok(label, condition, detail = '') {
    if (condition) {
      passed++;
      console.log(`  ✅ ${label}`);
    } else {
      failed++;
      console.log(`  ❌ ${label} ${detail}`);
    }
  }

  // 1. CREATE AFFAIRE
  console.log('\n=== 1. CREATE AFFAIRE ===');
  const createRes = await fetch(`${BASE}/api/affaires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nomClient: 'Test E2E Final',
      ville: 'Lyon',
      departement: '69',
      tempExtBase: -7,
      tempIntBase: 19,
    }),
  });
  const affaire = await createRes.json();
  ok('Create affaire', createRes.ok, JSON.stringify(affaire));
  const AID = affaire.id;

  // 2. CREATE BATIMENTS (first save)
  console.log('\n=== 2. CREATE BATIMENTS ===');
  const bats1 = [
    {
      id: 'new-1', numero: 1, designation: 'École primaire',
      typeBatiment: 'LOGEMENTS', surfaceChauffee: 1200, volumeChauffe: 3600,
      parc: 1, deperditions: 60, rendementProduction: 0.85,
      rendementDistribution: 0.95, rendementEmission: 0.98,
      rendementRegulation: 0.97, coefIntermittence: 1,
      typeEnergie: 'GAZ_NATUREL', tarification: 0.08, abonnement: 150,
      refDeperditions: 45, refRendementProduction: 0.92,
      refRendementDistribution: 0.95, refRendementEmission: 0.98,
      refRendementRegulation: 0.97, refTypeEnergie: 'GAZ_NATUREL',
    },
    {
      id: 'new-2', numero: 2, designation: 'Mairie',
      typeBatiment: 'BUREAUX', surfaceChauffee: 800, volumeChauffe: 2400,
      parc: 1, deperditions: 40, rendementProduction: 0.80,
      rendementDistribution: 0.90, rendementEmission: 0.95,
      rendementRegulation: 0.95, coefIntermittence: 0.85,
      typeEnergie: 'FUEL', tarification: 0.10, abonnement: 200,
      refDeperditions: 30, refRendementProduction: 0.88,
      refRendementDistribution: 0.92, refRendementEmission: 0.96,
      refRendementRegulation: 0.96, refTypeEnergie: 'FUEL',
    },
  ];
  const batRes = await fetch(`${BASE}/api/affaires/${AID}/batiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bats1),
  });
  const savedBats = await batRes.json();
  ok('Create batiments', batRes.ok && savedBats.length === 2, `Status: ${batRes.status}`);
  ok('Batiment has real ID', savedBats[0]?.id && !savedBats[0].id.startsWith('new-'));
  ok('Ref fields saved', savedBats[0]?.refDeperditions === 45);

  // 3. SECOND SAVE (update with real IDs — should NOT fail)
  console.log('\n=== 3. UPDATE BATIMENTS (second save) ===');
  savedBats[0].designation = 'École primaire (mis à jour)';
  const batRes2 = await fetch(`${BASE}/api/affaires/${AID}/batiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(savedBats),
  });
  const updBats = await batRes2.json();
  ok('Update batiments', batRes2.ok, `Status: ${batRes2.status} ${JSON.stringify(updBats).substring(0, 200)}`);
  ok('Designation updated', updBats[0]?.designation === 'École primaire (mis à jour)');

  // 4. CREATE PARC
  console.log('\n=== 4. CREATE PARC ===');
  const parcRes = await fetch(`${BASE}/api/affaires/${AID}/parcs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: '1',
      numero: 1,
      puissanceChaudiereBois: 300,
      rendementChaudiereBois: 0.85,
      puissanceChaudiere2: 100,
      rendementChaudiere2: 0.90,
      typeBiomasse: 'PLAQUETTE',
      longueurReseau: 200,
      sectionReseau: 'DN40',
      pourcentageCouvertureBois: 0.80,
    }),
  });
  const parc = await parcRes.json();
  ok('Create parc', parcRes.ok, `Status: ${parcRes.status} ${JSON.stringify(parc).substring(0, 200)}`);

  // 5. SAVE CHIFFRAGE REFERENCE
  console.log('\n=== 5. SAVE CHIFFRAGE REFERENCE ===');
  const chifRefRes = await fetch(`${BASE}/api/affaires/${AID}/chiffrage-reference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      travauxChaufferie: [
        { id: '1', designation: 'Chaudière fioul', unite: 'unité', qte: 1, pu: 15000 },
        { id: '2', designation: 'Réseau hydraulique', unite: 'm', qte: 50, pu: 120 },
      ],
      bureauControle: 0.05,
      maitriseOeuvre: 0.13,
      fraisDivers: 0.02,
      aleas: 0.05,
    }),
  });
  const chifRef = await chifRefRes.json();
  ok('Save chiffrage reference', chifRefRes.ok, `Status: ${chifRefRes.status} ${JSON.stringify(chifRef).substring(0, 200)}`);
  ok('Chiffrage ref has lignesChaufferie', chifRef.lignesChaufferie != null);

  // 6. SAVE CHIFFRAGE BIOMASSE
  console.log('\n=== 6. SAVE CHIFFRAGE BIOMASSE ===');
  const chifBioRes = await fetch(`${BASE}/api/affaires/${AID}/chiffrage-biomasse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vrd: 5000,
      grosOeuvre: 25000,
      charpente: 15000,
      processBois: 45000,
      chaudierAppoint: 12000,
      hydraulique: 8000,
      reseauChaleur: 18000,
      sousStation: 6000,
      installationReseauBat: 10000,
      autreTravaux: 3000,
      bureauControle: 0.03,
      maitriseOeuvre: 0.09,
      fraisDivers: 0.02,
      aleas: 0.05,
      cotEnr: 45,
      aideDepartementale: 20,
      detrDsil: 25,
      subventionComplementaire: 10,
      p2: 1200,
      consoElecSupplement: 500,
    }),
  });
  const chifBio = await chifBioRes.json();
  ok('Save chiffrage biomasse', chifBioRes.ok, `Status: ${chifBioRes.status} ${JSON.stringify(chifBio).substring(0, 200)}`);

  // 7. GET ALL DATA BACK
  console.log('\n=== 7. VERIFY ALL DATA ===');
  const [getBats, getParcs, getRef, getBio] = await Promise.all([
    fetch(`${BASE}/api/affaires/${AID}/batiments`).then(r => r.json()),
    fetch(`${BASE}/api/affaires/${AID}/parcs`).then(r => r.json()),
    fetch(`${BASE}/api/affaires/${AID}/chiffrage-reference`).then(r => r.json()),
    fetch(`${BASE}/api/affaires/${AID}/chiffrage-biomasse`).then(r => r.json()),
  ]);
  ok('GET batiments', getBats.length === 2);
  ok('GET parcs', getParcs.length >= 1);
  ok('GET chiffrage ref', getRef.id != null);
  ok('GET chiffrage bio', getBio.id != null);

  // 8. CALCULS ENDPOINT
  console.log('\n=== 8. CALCULS ===');
  const calcRes = await fetch(`${BASE}/api/calculs/${AID}`);
  const calc = await calcRes.json();
  ok('Calculs endpoint', calcRes.ok, `Status: ${calcRes.status}`);
  if (calc.error) console.log('    Calc warning:', calc.error);
  if (calcRes.ok) {
    ok('Calculs has batiments data', calc.batiments != null || calc.resultats != null);
  }

  // 9. COSTS ENDPOINT
  console.log('\n=== 9. COSTS ===');
  const costsRes = await fetch(`${BASE}/api/costs`);
  const costs = await costsRes.json();
  ok('Costs endpoint', costsRes.ok && Array.isArray(costs), `Status: ${costsRes.status} Count: ${costs?.length}`);

  // 10. DELETE TEST AFFAIRE (cleanup)
  console.log('\n=== 10. CLEANUP ===');
  const delRes = await fetch(`${BASE}/api/affaires/${AID}`, { method: 'DELETE' });
  ok('Delete test affaire', delRes.ok, `Status: ${delRes.status}`);

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

test().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
