// Quick E2E API test
const BASE = 'http://localhost:3001';

async function test() {
  const affaireId = 'cmmkm2qii000jutvgkgr6kzvz';
  
  // 1. Test batiment creation
  console.log('\n=== 1. CREATE BATIMENT ===');
  try {
    const res = await fetch(`${BASE}/api/affaires/${affaireId}/batiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        id: 'new-1',
        numero: 1,
        designation: 'Batiment Test',
        typeBatiment: 'LOGEMENTS',
        surfaceChauffee: 1000,
        volumeChauffe: 3000,
        deperditions: 50,
        rendementProduction: 0.85,
        rendementDistribution: 0.95,
        rendementEmission: 0.98,
        rendementRegulation: 0.97,
        coefIntermittence: 1,
        typeEnergie: 'GAZ_NATUREL',
        tarification: 0.08,
        abonnement: 150,
      }, {
        id: 'new-2',
        numero: 2,
        designation: 'Batiment Test 2',
        typeBatiment: 'BUREAUX',
        surfaceChauffee: 500,
        volumeChauffe: 1500,
        deperditions: 30,
        rendementProduction: 0.80,
        rendementDistribution: 0.90,
        rendementEmission: 0.95,
        rendementRegulation: 0.95,
        coefIntermittence: 0.9,
        typeEnergie: 'FUEL',
        tarification: 0.10,
        abonnement: 200,
      }]),
    });
    const body = await res.json();
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(body, null, 2));
    if (!res.ok) throw new Error('Batiment creation failed: ' + JSON.stringify(body));
    
    const batIds = body.map(b => b.id);
    console.log('Batiment IDs:', batIds);

    // 2. Test GET batiments
    console.log('\n=== 2. GET BATIMENTS ===');
    const getBats = await fetch(`${BASE}/api/affaires/${affaireId}/batiments`);
    const bats = await getBats.json();
    console.log('Status:', getBats.status, '- Count:', bats.length);

    // 3. Test parc creation
    console.log('\n=== 3. SAVE PARC ===');
    const parcRes = await fetch(`${BASE}/api/affaires/${affaireId}/parcs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: 1,
        puissanceChaudiereBois: 300,
        rendementChaudiereBois: 0.85,
        typeBiomasse: 'PLAQUETTES',
        pciCarburant: 2500,
        tauxCouverture: 80,
        puissanceAppoint: 100,
        rendementAppoint: 0.90,
        typeAppoint: 'GAZ_NATUREL',
        tarifBiomasse: 30,
        tarifAppoint: 0.08,
      }),
    });
    const parc = await parcRes.json();
    console.log('Status:', parcRes.status);
    console.log('Parc:', JSON.stringify(parc, null, 2));
    if (!parcRes.ok) throw new Error('Parc creation failed: ' + JSON.stringify(parc));

    // 4. Test chiffrage reference
    console.log('\n=== 4. SAVE CHIFFRAGE REFERENCE ===');
    const chifRefRes = await fetch(`${BASE}/api/affaires/${affaireId}/chiffrage-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcId: parc.id,
        lignesIsolation: JSON.stringify([
          { designation: 'Combles', quantite: 200, pu: 45, montant: 9000 },
          { designation: 'Murs', quantite: 150, pu: 80, montant: 12000 },
        ]),
        lignesChaufferie: JSON.stringify([
          { designation: 'Chaudière gaz', quantite: 1, pu: 15000, montant: 15000 },
        ]),
        tauxMaitreOeuvre: 10,
        tauxBureauEtude: 5,
        tauxDivers: 3,
        tauxAleas: 5,
      }),
    });
    const chifRef = await chifRefRes.json();
    console.log('Status:', chifRefRes.status);
    console.log('ChiffrageRef:', JSON.stringify(chifRef, null, 2));
    if (!chifRefRes.ok) throw new Error('ChiffrageRef failed: ' + JSON.stringify(chifRef));

    // 5. Test chiffrage biomasse
    console.log('\n=== 5. SAVE CHIFFRAGE BIOMASSE ===');
    const chifBioRes = await fetch(`${BASE}/api/affaires/${affaireId}/chiffrage-biomasse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcId: parc.id,
        vrd: 5000,
        grosOeuvre: 20000,
        chaufferieBiomasse: 80000,
        chauffageBatiments: 15000,
        autresTravaux: 3000,
        tauxMaitreOeuvre: 10,
        tauxBureauEtude: 5,
        tauxDivers: 3,
        tauxAleas: 5,
        subventionAdeme: 20000,
        subventionRegion: 10000,
        subventionDepartement: 5000,
        subventionAutre: 0,
      }),
    });
    const chifBio = await chifBioRes.json();
    console.log('Status:', chifBioRes.status);
    console.log('ChiffrageBio:', JSON.stringify(chifBio, null, 2));
    if (!chifBioRes.ok) throw new Error('ChiffrageBio failed: ' + JSON.stringify(chifBio));

    // 6. Test calculs endpoint
    console.log('\n=== 6. GET CALCULS ===');
    const calcRes = await fetch(`${BASE}/api/calculs/${affaireId}`);
    const calc = await calcRes.json();
    console.log('Status:', calcRes.status);
    if (calcRes.ok) {
      console.log('Keys:', Object.keys(calc));
      if (calc.error) console.log('Calc error:', calc.error);
    } else {
      console.log('Calc error:', JSON.stringify(calc, null, 2));
    }

    // 7. Test costs endpoint
    console.log('\n=== 7. GET COSTS ===');
    const costsRes = await fetch(`${BASE}/api/costs`);
    const costs = await costsRes.json();
    console.log('Status:', costsRes.status, '- Count:', costs.length);

    // 8. Test meteo endpoint
    console.log('\n=== 8. GET METEO ===');
    const meteoRes = await fetch(`${BASE}/api/meteo/69`);
    const meteo = await meteoRes.json();
    console.log('Status:', meteoRes.status);
    if (meteoRes.ok) {
      console.log('Meteo keys:', Object.keys(meteo));
    } else {
      console.log('Meteo error:', JSON.stringify(meteo, null, 2));
    }

    console.log('\n=== ALL TESTS PASSED ===');
  } catch (err) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(err.message || err);
  }
}

test();
