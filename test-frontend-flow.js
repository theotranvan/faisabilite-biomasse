// Test frontend page load + batiment creation flow
const BASE = 'http://localhost:3001';

async function test() {
  // Create a fresh affaire for testing
  console.log('=== Creating fresh test affaire ===');
  const createRes = await fetch(`${BASE}/api/affaires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nomClient: 'Test Frontend Flow',
      ville: 'Paris',
      departement: '75',
      tempExtBase: -7,
      tempIntBase: 19,
    }),
  });
  
  if (!createRes.ok) {
    console.error('Failed to create affaire:', await createRes.text());
    return;
  }
  const affaire = await createRes.json();
  console.log('Affaire created:', affaire.id, affaire.referenceAffaire);

  // Simulate what the page does on load (lines 107-134 of affaire/[id]/page.tsx)
  console.log('\n=== Simulating page load fetches ===');
  
  const [batsRes, parcsRes, refRes, bioRes] = await Promise.all([
    fetch(`${BASE}/api/affaires/${affaire.id}/batiments`),
    fetch(`${BASE}/api/affaires/${affaire.id}/parcs`),
    fetch(`${BASE}/api/affaires/${affaire.id}/chiffrage-reference`),
    fetch(`${BASE}/api/affaires/${affaire.id}/chiffrage-biomasse`),
  ]);

  console.log('Batiments:', batsRes.status, '-', await batsRes.text());
  console.log('Parcs:', parcsRes.status, '-', await parcsRes.text());
  console.log('ChiffrageRef:', refRes.status, '-', await refRes.text());
  console.log('ChiffrageBio:', bioRes.status, '-', await bioRes.text());

  // Now simulate adding a batiment and saving
  console.log('\n=== Simulating batiment creation ===');
  const newBats = [{
    id: 'new-' + Date.now(),
    numero: 1,
    designation: 'Nouveau bâtiment',
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
  }];

  const saveRes = await fetch(`${BASE}/api/affaires/${affaire.id}/batiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBats),
  });

  console.log('Save status:', saveRes.status);
  const savedBats = await saveRes.json();
  console.log('Saved:', JSON.stringify(savedBats, null, 2));

  // Now simulate a second save (where local state still has new- IDs)
  console.log('\n=== Simulating second save (with stale new- IDs) ===');
  const saveRes2 = await fetch(`${BASE}/api/affaires/${affaire.id}/batiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBats), // Still has 'new-' IDs
  });

  console.log('Second save status:', saveRes2.status);
  const saved2 = await saveRes2.json();
  console.log('Second save result:', JSON.stringify(saved2, null, 2));

  // Now simulate page access (HTML)
  console.log('\n=== Testing page HTML load ===');
  const pageRes = await fetch(`${BASE}/affaires/${affaire.id}`);
  console.log('Page status:', pageRes.status);
  const html = await pageRes.text();
  // Check for errors in HTML
  if (html.includes('error') || html.includes('Error') || html.includes('Erreur')) {
    // Extract error context
    const errorMatch = html.match(/(error|Error|Erreur)[^<]{0,200}/gi);
    if (errorMatch) {
      console.log('Errors found in page HTML:');
      errorMatch.forEach(e => console.log('  -', e.substring(0, 100)));
    }
  }
  if (html.includes('__NEXT_DATA__')) {
    const dataMatch = html.match(/__NEXT_DATA__.*?<\/script>/);
    if (dataMatch) {
      const nextData = dataMatch[0].replace('__NEXT_DATA__ = ', '').replace('</script>', '');
      try {
        const parsed = JSON.parse(nextData.replace(/__NEXT_DATA__\s*=\s*/, ''));
        if (parsed.err) console.log('Next.js error:', parsed.err);
      } catch {}
    }
  }
  console.log('Page HTML length:', html.length, 'chars');

  console.log('\n=== DONE ===');
}

test().catch(console.error);
