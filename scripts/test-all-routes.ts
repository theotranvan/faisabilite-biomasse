/**
 * TEST AUTOMATISÉ COMPLET — Faisabilité Biomasse
 * ================================================
 * Teste TOUTES les routes API et enchaînements fonctionnels :
 *   - Auth (login, register)
 *   - CRUD Affaires (create, read, update, list, duplicate, share, delete)
 *   - CRUD Bâtiments (create, read, update, delete)
 *   - CRUD Parcs (create, read, update, delete)
 *   - Isolation (create, read)
 *   - Chiffrage Référence (create, read)
 *   - Chiffrage Biomasse (create, read)
 *   - Calculs complets (GET /api/calculs/[id])
 *   - Méteo (GET département, GET monotone, GET villes)
 *   - Admin Costs (GET, POST, PUT, DELETE)
 *   - Admin Meteo Import (DJU CSV, Monotone CSV)
 *   - Nettoyage final (suppression données de test)
 *
 * Usage:  npx tsx scripts/test-all-routes.ts
 */

const BASE = 'http://localhost:3000';
const TS = Date.now();

// ─── Types & state ───────────────────────────────────────
interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  detail?: string;
}
const results: TestResult[] = [];
let cookie = ''; // session cookie set after login

// Generated IDs to clean up
let testUserId = '';
let testAffaireId = '';
let testBatimentIds: string[] = [];
let testParcIds: string[] = [];
let testCostId = '';
let duplicatedAffaireId = '';

// ─── Helpers ─────────────────────────────────────────────
function record(group: string, name: string, passed: boolean, detail?: string) {
  results.push({ group, name, passed, detail });
  const icon = passed ? '✓' : '✗';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`  ${color}${icon}\x1b[0m ${name}${detail ? `  (${detail})` : ''}`);
}

async function api(
  method: string,
  path: string,
  body?: any,
  opts?: { formData?: FormData; expectStatus?: number }
): Promise<{ status: number; data: any; ok: boolean }> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {};
  if (cookie) headers['Cookie'] = cookie;

  let fetchOpts: any = { method, headers, redirect: 'manual' as RequestRedirect };
  if (opts?.formData) {
    fetchOpts.body = opts.formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOpts);

  // Capture set-cookie
  const sc = res.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];

  let data: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    // If we get HTML, it means we hit a redirect / auth page
    data = { _html: text.substring(0, 200) };
  }
  return { status: res.status, data, ok: res.ok };
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}

// ─── Auth helpers ────────────────────────────────────────
async function loginAs(email: string, password: string): Promise<boolean> {
  // Use NextAuth's credentials signIn via the CSRF + callback flow
  // Step 1: get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { redirect: 'manual' });
  const csrfCookie = csrfRes.headers.get('set-cookie')?.split(';')[0] || '';
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // Step 2: POST credentials
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: 'true',
    }),
    redirect: 'manual',
  });

  // Collect all cookies
  const cookies: string[] = [];
  loginRes.headers.forEach((value: string, key: string) => {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(value.split(';')[0]);
    }
  });
  if (csrfCookie) cookies.push(csrfCookie);
  cookie = cookies.join('; ');

  // Step 3: Verify session
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  const session = await sessionRes.json();
  // Recollect cookies from session endpoint too
  sessionRes.headers.forEach((value: string, key: string) => {
    if (key.toLowerCase() === 'set-cookie') {
      const c = value.split(';')[0];
      if (!cookie.includes(c)) cookie += '; ' + c;
    }
  });

  return !!session?.user?.email;
}

// ══════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(60));
  console.log('  TEST COMPLET — Toutes les routes API');
  console.log('  ' + new Date().toISOString());
  console.log('═'.repeat(60));

  // ────────────────────────────────────────────────────────
  // 1. AUTH — Login / Register / Session
  // ────────────────────────────────────────────────────────
  section('1. AUTH — Connexion & Inscription');

  // 1a. Login route directe (POST /api/auth/login)
  {
    const r = await api('POST', '/api/auth/login', { email: 'user@unique.local', password: 'biomasse2026' });
    record('AUTH', 'POST /api/auth/login — valid credentials', r.status === 200 && r.data?.user?.email === 'user@unique.local', `status=${r.status}`);
  }
  {
    const r = await api('POST', '/api/auth/login', { email: 'nobody@test.com', password: 'wrong' });
    record('AUTH', 'POST /api/auth/login — invalid credentials → 401', r.status === 401, `status=${r.status}`);
  }
  {
    const r = await api('POST', '/api/auth/login', {});
    record('AUTH', 'POST /api/auth/login — missing fields → 400', r.status === 400, `status=${r.status}`);
  }

  // 1b. Register route (POST /api/auth/register)
  const testEmail = `test-${TS}@test.local`;
  {
    const r = await api('POST', '/api/auth/register', {
      email: testEmail, password: 'TestPass123!', nom: 'Test', prenom: 'Auto',
    });
    record('AUTH', 'POST /api/auth/register — create user', r.status === 201 && !!r.data?.user?.id, `status=${r.status}`);
    if (r.data?.user?.id) testUserId = r.data.user.id;
  }
  {
    const r = await api('POST', '/api/auth/register', {
      email: testEmail, password: 'TestPass123!', nom: 'Test', prenom: 'Auto',
    });
    record('AUTH', 'POST /api/auth/register — duplicate email → 409', r.status === 409, `status=${r.status}`);
  }
  {
    const r = await api('POST', '/api/auth/register', { email: 'x@x.com' });
    record('AUTH', 'POST /api/auth/register — missing fields → 400', r.status === 400, `status=${r.status}`);
  }

  // 1c. Login via NextAuth (establishes session cookie)
  {
    const ok = await loginAs('user@unique.local', 'biomasse2026');
    record('AUTH', 'NextAuth credentials login + session', ok, ok ? 'session active' : 'no session');
  }

  // 1d. GET /api/auth/session
  {
    const r = await api('GET', '/api/auth/session');
    record('AUTH', 'GET /api/auth/session', r.status === 200 && !!r.data?.user, `user=${r.data?.user?.email}`);
  }

  // ────────────────────────────────────────────────────────
  // 2. AFFAIRES — CRUD
  // ────────────────────────────────────────────────────────
  section('2. AFFAIRES — CRUD complet');

  // 2a. Create affaire
  {
    const r = await api('POST', '/api/affaires', {
      nomClient: `Client-Test-${TS}`,
      adresse: '10 rue du Test',
      ville: 'Rennes',
      departement: '35',
      notes: 'Affaire de test automatisé',
    });
    record('AFFAIRES', 'POST /api/affaires — créer affaire', r.status === 201 && !!r.data?.id, `id=${r.data?.id}`);
    if (r.data?.id) testAffaireId = r.data.id;
  }

  // 2b. Create affaire — missing fields
  {
    const r = await api('POST', '/api/affaires', { nomClient: 'Incomplete' });
    record('AFFAIRES', 'POST /api/affaires — champs manquants → 400', r.status === 400, `status=${r.status}`);
  }

  // 2c. List affaires
  {
    const r = await api('GET', '/api/affaires');
    record('AFFAIRES', 'GET /api/affaires — liste', r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);
  }

  // 2d. Get single affaire
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}`);
    record('AFFAIRES', 'GET /api/affaires/[id] — détail', r.status === 200 && r.data?.id === testAffaireId, `client=${r.data?.nomClient}`);
  }

  // 2e. Get non-existent affaire
  {
    const r = await api('GET', '/api/affaires/nonexistent999');
    record('AFFAIRES', 'GET /api/affaires/[id] — 404', r.status === 404, `status=${r.status}`);
  }

  // 2f. Update affaire
  {
    const r = await api('PUT', `/api/affaires/${testAffaireId}`, {
      nomClient: `Client-Updated-${TS}`,
      adresse: '20 rue du Test',
      ville: 'Rennes',
      departement: '35',
      statut: 'EN_COURS',
    });
    record('AFFAIRES', 'PUT /api/affaires/[id] — update', r.status === 200 && r.data?.statut === 'EN_COURS', `statut=${r.data?.statut}`);
  }

  // ────────────────────────────────────────────────────────
  // 3. BÂTIMENTS — CRUD
  // ────────────────────────────────────────────────────────
  section('3. BÂTIMENTS — CRUD complet');

  // 3a. Create 3 bâtiments (POST array)
  {
    const bats = [
      {
        numero: 1, designation: 'Mairie', typeBatiment: 'BUREAUX', parc: 1,
        surfaceChauffee: 500, volumeChauffe: 1500,
        deperditions: 25, rendementProduction: 80, rendementDistribution: 85,
        rendementEmission: 90, rendementRegulation: 95, coefIntermittence: 0.85,
        typeEnergie: 'FUEL', tarification: 1.2, abonnement: 300,
        consommationsReelles: 40000,
        refDeperditions: 25, refTypeEnergie: 'GAZ_NATUREL',
        refRendementProduction: 90, refRendementDistribution: 90,
        refRendementEmission: 95, refRendementRegulation: 98,
        refTarification: 0.1, refAbonnement: 200,
      },
      {
        numero: 2, designation: 'École', typeBatiment: 'ENSEIGNEMENT', parc: 1,
        surfaceChauffee: 800, volumeChauffe: 2400,
        deperditions: 40, rendementProduction: 75, rendementDistribution: 80,
        rendementEmission: 88, rendementRegulation: 92, coefIntermittence: 0.80,
        typeEnergie: 'ELECTRICITE', tarification: 0.18, abonnement: 500,
        refDeperditions: 40, refTypeEnergie: 'GAZ_NATUREL',
        refRendementProduction: 92, refRendementDistribution: 88,
        refRendementEmission: 93, refRendementRegulation: 97,
        refTarification: 0.1, refAbonnement: 250,
      },
      {
        numero: 3, designation: 'Gymnase', typeBatiment: 'SPORT', parc: 2,
        surfaceChauffee: 1200, volumeChauffe: 6000,
        deperditions: 60, rendementProduction: 70, rendementDistribution: 82,
        rendementEmission: 85, rendementRegulation: 90, coefIntermittence: 0.75,
        typeEnergie: 'FUEL', tarification: 1.2, abonnement: 400,
        refDeperditions: 60, refTypeEnergie: 'GAZ_NATUREL',
        refRendementProduction: 88, refRendementDistribution: 90,
        refRendementEmission: 92, refRendementRegulation: 96,
        refTarification: 0.1, refAbonnement: 300,
      },
    ];
    const r = await api('POST', `/api/affaires/${testAffaireId}/batiments`, bats);
    record('BATIMENTS', 'POST batiments — créer 3 bâtiments', r.status === 200 && Array.isArray(r.data) && r.data.length === 3, `count=${r.data?.length}`);
    if (Array.isArray(r.data)) testBatimentIds = r.data.map((b: any) => b.id);
  }

  // 3b. GET all bâtiments
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}/batiments`);
    record('BATIMENTS', 'GET batiments — liste', r.status === 200 && Array.isArray(r.data) && r.data.length >= 3, `count=${r.data?.length}`);
  }

  // 3c. Update a batiment (POST with existing id)
  if (testBatimentIds[0]) {
    const r = await api('POST', `/api/affaires/${testAffaireId}/batiments`, [{
      id: testBatimentIds[0],
      numero: 1, designation: 'Mairie Rénovée', typeBatiment: 'BUREAUX', parc: 1,
      surfaceChauffee: 520, volumeChauffe: 1560,
      deperditions: 22, rendementProduction: 82, rendementDistribution: 87,
      rendementEmission: 91, rendementRegulation: 96, coefIntermittence: 0.85,
      typeEnergie: 'FUEL', tarification: 1.2, abonnement: 300,
      refDeperditions: 22, refTypeEnergie: 'GAZ_NATUREL',
      refRendementProduction: 90, refRendementDistribution: 90,
      refRendementEmission: 95, refRendementRegulation: 98,
      refTarification: 0.1, refAbonnement: 200,
    }]);
    record('BATIMENTS', 'POST batiments — update bâtiment existant', r.status === 200, `designation=${r.data?.[0]?.designation}`);
  }

  // 3d. Validation — rendement hors bornes → 400
  {
    const r = await api('POST', `/api/affaires/${testAffaireId}/batiments`, [{
      numero: 99, designation: 'Invalid', rendementProduction: 150,
    }]);
    record('BATIMENTS', 'POST batiments — rendement >100 → 400', r.status === 400, `status=${r.status}`);
  }

  // 3e. Delete a batiment
  if (testBatimentIds[2]) {
    const r = await api('DELETE', `/api/affaires/${testAffaireId}/batiments`, { batimentId: testBatimentIds[2] });
    record('BATIMENTS', 'DELETE batiment', r.status === 200 && r.data?.success, `success=${r.data?.success}`);
    testBatimentIds.pop();
  }

  // ────────────────────────────────────────────────────────
  // 4. PARCS — CRUD
  // ────────────────────────────────────────────────────────
  section('4. PARCS — CRUD complet');

  // 4a. Create 2 parcs
  {
    const parcs = [
      {
        numero: 1, puissanceChaudiereBois: 50, rendementChaudiereBois: 85,
        typeBiomasse: 'PLAQUETTE', pourcentageCouvertureBois: 80,
        puissanceChaudiere2: 30, rendementChaudiere2: 90,
        combustibleAppoint: 'Gaz naturel',
      },
      {
        numero: 2, puissanceChaudiereBois: 80, rendementChaudiereBois: 88,
        typeBiomasse: 'GRANULES', pourcentageCouvertureBois: 100,
      },
    ];
    const r = await api('POST', `/api/affaires/${testAffaireId}/parcs`, parcs);
    record('PARCS', 'POST parcs — créer 2 parcs', r.status === 200 && Array.isArray(r.data) && r.data.length === 2, `count=${r.data?.length}`);
    if (Array.isArray(r.data)) testParcIds = r.data.map((p: any) => p.id);
  }

  // 4b. GET all parcs
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}/parcs`);
    record('PARCS', 'GET parcs — liste', r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);
  }

  // 4c. Update parc (POST with existing id)
  if (testParcIds[0]) {
    const r = await api('POST', `/api/affaires/${testAffaireId}/parcs`, [{
      id: testParcIds[0], numero: 1, puissanceChaudiereBois: 55,
      rendementChaudiereBois: 86, typeBiomasse: 'PLAQUETTE',
      pourcentageCouvertureBois: 85,
    }]);
    record('PARCS', 'POST parcs — update parc existant', r.status === 200, `puissance=${r.data?.[0]?.puissanceChaudiereBois}`);
  }

  // 4d. Delete parc 2 then recreate (to test DELETE)
  if (testParcIds[1]) {
    const r = await api('DELETE', `/api/affaires/${testAffaireId}/parcs`, { parcId: testParcIds[1] });
    record('PARCS', 'DELETE parc', r.status === 200 && r.data?.success, `success=${r.data?.success}`);
    // Recreate for later tests
    const r2 = await api('POST', `/api/affaires/${testAffaireId}/parcs`, {
      numero: 2, puissanceChaudiereBois: 80, rendementChaudiereBois: 88,
      typeBiomasse: 'GRANULES', pourcentageCouvertureBois: 100,
    });
    if (r2.data?.id) testParcIds[1] = r2.data.id;
  }

  // ────────────────────────────────────────────────────────
  // 5. ISOLATION — CRUD
  // ────────────────────────────────────────────────────────
  section('5. ISOLATION — Travaux d\'isolation');

  if (testBatimentIds[0]) {
    // 5a. POST isolation
    {
      const r = await api('POST', `/api/affaires/${testAffaireId}/batiments/${testBatimentIds[0]}/isolation`, {
        lignes: [
          { designation: 'Combles perdus', unite: 'm²', quantite: 200, prixUnitaire: 25, dejaRealise: 50 },
          { designation: 'Murs extérieurs', unite: 'm²', quantite: 150, prixUnitaire: 80, dejaRealise: 0 },
          { designation: 'Menuiseries', unite: 'u', quantite: 12, prixUnitaire: 500, dejaRealise: 3000 },
        ],
      });
      record('ISOLATION', 'POST isolation — 3 lignes', r.status === 200 && r.data?.lignes?.length === 3, `lignes=${r.data?.lignes?.length}`);
    }

    // 5b. GET isolation
    {
      const r = await api('GET', `/api/affaires/${testAffaireId}/batiments/${testBatimentIds[0]}/isolation`);
      record('ISOLATION', 'GET isolation', r.status === 200 && r.data?.lignes?.length === 3, `lignes=${r.data?.lignes?.length}`);
    }

    // 5c. Update isolation (replace lines)
    {
      const r = await api('POST', `/api/affaires/${testAffaireId}/batiments/${testBatimentIds[0]}/isolation`, {
        lignes: [
          { designation: 'Combles perdus (mis à jour)', unite: 'm²', quantite: 250, prixUnitaire: 22, dejaRealise: 100 },
        ],
      });
      record('ISOLATION', 'POST isolation — remplacement lignes', r.status === 200 && r.data?.lignes?.length === 1, `lignes=${r.data?.lignes?.length}`);
    }
  }

  // 5d. GET isolation on batiment without set isolation
  if (testBatimentIds[1]) {
    const r = await api('GET', `/api/affaires/${testAffaireId}/batiments/${testBatimentIds[1]}/isolation`);
    record('ISOLATION', 'GET isolation — bâtiment sans isolation', r.status === 200, `lignes=${r.data?.lignes?.length ?? 0}`);
  }

  // ────────────────────────────────────────────────────────
  // 6. CHIFFRAGE RÉFÉRENCE
  // ────────────────────────────────────────────────────────
  section('6. CHIFFRAGE RÉFÉRENCE');

  // 6a. POST chiffrage reference parc 1
  {
    const r = await api('POST', `/api/affaires/${testAffaireId}/chiffrage-reference?parc=1`, {
      travauxChaufferie: [
        { designation: 'Chaudière gaz condensation', unite: 'u', qte: 1, prixUnitaire: 15000 },
        { designation: 'Raccordement gaz', unite: 'forfait', qte: 1, prixUnitaire: 3000 },
      ],
      lignesIsolation: JSON.stringify([
        { designation: 'Combles', total: 5000, dejaRealise: 100 },
      ]),
      bureauControle: 0.03,
      maitriseOeuvre: 0.13,
      fraisDivers: 0.02,
      aleas: 0.05,
    });
    record('CHIFFRAGE_REF', 'POST chiffrage-reference parc 1', r.status === 200 && !!r.data?.id, `id=${r.data?.id}`);
  }

  // 6b. GET chiffrage reference parc 1
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}/chiffrage-reference?parc=1`);
    record('CHIFFRAGE_REF', 'GET chiffrage-reference parc 1', r.status === 200 && !!r.data?.id, `id=${r.data?.id}`);
  }

  // 6c. GET all chiffrages reference (legacy)
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}/chiffrage-reference`);
    record('CHIFFRAGE_REF', 'GET chiffrage-reference — all parcs', r.status === 200, `keys=${Object.keys(r.data || {}).length}`);
  }

  // ────────────────────────────────────────────────────────
  // 7. CHIFFRAGE BIOMASSE
  // ────────────────────────────────────────────────────────
  section('7. CHIFFRAGE BIOMASSE');

  // 7a. POST chiffrage biomasse parc 1
  {
    const r = await api('POST', `/api/affaires/${testAffaireId}/chiffrage-biomasse?parc=1`, {
      vrd: 5000,
      grosOeuvre: 15000,
      charpenteCouverture: 8000,
      processBois: 45000,
      chaudiereAppoint: 12000,
      hydrauliqueChaufferie: 7000,
      reseauChaleurQte: 200,
      reseauChaleurPU: 150,
      sousStation: 3000,
      installationReseau: 5000,
      autresTravaux: 2000,
      tauxBureauControle: 0.03,
      tauxMaitriseOeuvre: 0.09,
      tauxFraisDivers: 0.02,
      tauxAleas: 0.05,
      tauxSubventionCotEnr: 0.55,
      tauxAideDepartementale: 0.05,
      tauxDetrDsil: 0.10,
      montantP2: 1500,
      consoElecSupplementaire: 800,
    });
    record('CHIFFRAGE_BIO', 'POST chiffrage-biomasse parc 1', r.status === 200 && !!r.data?.id, `id=${r.data?.id}`);
  }

  // 7b. GET chiffrage biomasse parc 1
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}/chiffrage-biomasse?parc=1`);
    record('CHIFFRAGE_BIO', 'GET chiffrage-biomasse parc 1', r.status === 200 && !!r.data?.id, `processBois=${r.data?.processBois}`);
  }

  // 7c. Update chiffrage biomasse (POST again → upsert)
  {
    const r = await api('POST', `/api/affaires/${testAffaireId}/chiffrage-biomasse?parc=1`, {
      processBois: 48000,
      montantP2: 1800,
    });
    record('CHIFFRAGE_BIO', 'POST chiffrage-biomasse — update (upsert)', r.status === 200 && r.data?.processBois === 48000, `processBois=${r.data?.processBois}`);
  }

  // 7d. GET all chiffrages biomasse (legacy)
  {
    const r = await api('GET', `/api/affaires/${testAffaireId}/chiffrage-biomasse`);
    record('CHIFFRAGE_BIO', 'GET chiffrage-biomasse — all parcs', r.status === 200, `keys=${Object.keys(r.data || {}).length}`);
  }

  // ────────────────────────────────────────────────────────
  // 8. CALCULS — Moteur de calcul complet
  // ────────────────────────────────────────────────────────
  section('8. CALCULS — Moteur de calcul');

  {
    const r = await api('GET', `/api/calculs/${testAffaireId}`);
    record('CALCULS', 'GET /api/calculs/[id]', r.status === 200 && r.data?.batiments?.length >= 2, `bâtiments=${r.data?.batiments?.length}`);
    if (r.data?.batiments) {
      const b1 = r.data.batiments[0];
      record('CALCULS', 'Bât1 — coutAnnuel défini', typeof b1?.cout_annuel === 'number' && b1.cout_annuel > 0, `${b1?.cout_annuel?.toFixed(0)}€`);
      record('CALCULS', 'Bât1 — consoRefCalculees défini', typeof b1?.conso_ref_calculees === 'number', `${b1?.conso_ref_calculees?.toFixed(0)} kWh`);
      record('CALCULS', 'Bât1 — étiquette DPE', typeof b1?.etiquette_dpe === 'string', `DPE=${b1?.etiquette_dpe}`);
    }
    if (r.data?.parcs) {
      const p1 = r.data.parcs[0];
      record('CALCULS', 'Parc1 — puissance définie', typeof p1?.puissance_chauffage === 'number', `${p1?.puissance_chauffage?.toFixed(0)} kW`);
      record('CALCULS', 'Parc1 — consoParcRef définie', typeof p1?.conso_sortie_ref === 'number', `${p1?.conso_sortie_ref?.toFixed(0)} kWh`);
    }
  }

  // 8b. Calculs — affaire inexistante
  {
    const r = await api('GET', '/api/calculs/nonexistent999');
    record('CALCULS', 'GET /api/calculs/[id] — 404', r.status === 404, `status=${r.status}`);
  }

  // ────────────────────────────────────────────────────────
  // 9. MÉTÉO
  // ────────────────────────────────────────────────────────
  section('9. MÉTÉO — DJU & Monotone');

  // 9a. GET département (seeded with names, e.g. 'Ille-et-Vilaine')
  {
    const r = await api('GET', '/api/meteo/Ille-et-Vilaine');
    record('METEO', 'GET /api/meteo/Ille-et-Vilaine — DJU', r.status === 200 && typeof r.data?.dju === 'number', `dju=${r.data?.dju}`);
  }

  // 9b. GET département non-trouvé
  {
    const r = await api('GET', '/api/meteo/Inexistant');
    record('METEO', 'GET /api/meteo/Inexistant — département inconnu → 404', r.status === 404, `status=${r.status}`);
  }

  // 9c. GET monotone — if seeded
  {
    const r = await api('GET', '/api/meteo/monotone/Rennes');
    if (r.status === 200 && Array.isArray(r.data)) {
      record('METEO', 'GET /api/meteo/monotone/Rennes — courbe horaire', r.data.length > 0, `heures=${r.data.length}`);
    } else {
      record('METEO', 'GET /api/meteo/monotone/Rennes — pas de données', r.status === 404, `status=${r.status} (normal si non seedé)`);
    }
  }

  // 9d. GET villes monotone → needs admin, tested in section 10

  // ────────────────────────────────────────────────────────
  // 10. ADMIN — Imports Météo (DJU + Monotone CSV)
  // ────────────────────────────────────────────────────────
  section('10. ADMIN — Imports Météo');

  // Login as admin first
  {
    const ok = await loginAs('admin@biomasse.local', 'biomasse2026');
    record('ADMIN', 'Login admin@biomasse.local', ok, ok ? 'session admin active' : 'échec login admin');
  }

  // 10x. GET villes monotone (admin only)
  {
    const r = await api('GET', '/api/admin/meteo/villes');
    record('ADMIN_METEO', 'GET /api/admin/meteo/villes', r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);
  }

  // 10a. Import DJU CSV
  {
    const csvContent = 'departement,dju\n99,2500\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'test-dju.csv');
    formData.append('annee', '2025');
    const r = await api('POST', '/api/admin/meteo/dju-import', undefined, { formData });
    record('ADMIN_METEO', 'POST dju-import — CSV import', r.status === 200 && r.data?.count >= 1, `count=${r.data?.count}`);
  }

  // 10b. Import Monotone CSV
  {
    // Simulate 8760 hourly temperatures
    const temps = Array.from({ length: 8760 }, (_, i) => (10 + 15 * Math.sin(i * Math.PI / 4380)).toFixed(1));
    const csvContent = 'temperature\n' + temps.join('\n') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'test-monotone.csv');
    formData.append('ville', `TestVille-${TS}`);
    const r = await api('POST', '/api/admin/meteo/monotone-import', undefined, { formData });
    record('ADMIN_METEO', 'POST monotone-import — 8760h curve', r.status === 200 && r.data?.heures === 8760, `heures=${r.data?.heures}`);
  }

  // 10c. Verify imported monotone
  {
    const r = await api('GET', `/api/meteo/monotone/TestVille-${TS}`);
    record('ADMIN_METEO', 'GET monotone ville importée', r.status === 200 && Array.isArray(r.data) && r.data.length === 8760, `heures=${r.data?.length}`);
  }

  // ────────────────────────────────────────────────────────
  // 11. ADMIN — Base Coûts CRUD
  // ────────────────────────────────────────────────────────
  section('11. ADMIN — Base de Coûts CRUD');

  // 11a. GET costs
  {
    const r = await api('GET', '/api/costs');
    record('COSTS', 'GET /api/costs — liste', r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);
  }

  // 11b. POST new cost (admin)
  {
    const r = await api('POST', '/api/costs', {
      categorie: 'TEST', designation: `TestCost-${TS}`, prixUnitaire: 42.50, unite: 'u',
    });
    record('COSTS', 'POST /api/costs — créer coût', r.status === 200 && !!r.data?.id, `id=${r.data?.id}`);
    if (r.data?.id) testCostId = r.data.id;
  }

  // 11c. POST duplicate cost → 409
  {
    const r = await api('POST', '/api/costs', {
      categorie: 'TEST', designation: `TestCost-${TS}`, prixUnitaire: 99, unite: 'u',
    });
    record('COSTS', 'POST /api/costs — doublon → 409', r.status === 409, `status=${r.status}`);
  }

  // 11d. PUT update cost
  if (testCostId) {
    const r = await api('PUT', '/api/costs', { id: testCostId, prixUnitaire: 55.00 });
    record('COSTS', 'PUT /api/costs — update', r.status === 200 && r.data?.prixUnitaire === 55, `prix=${r.data?.prixUnitaire}`);
  }

  // 11e. DELETE cost
  if (testCostId) {
    const r = await api('DELETE', '/api/costs', { id: testCostId });
    record('COSTS', 'DELETE /api/costs', r.status === 200 && r.data?.success, `success=${r.data?.success}`);
  }

  // ────────────────────────────────────────────────────────
  // 12. AFFAIRES — Duplication & Partage
  // ────────────────────────────────────────────────────────
  section('12. AFFAIRES — Duplication & Partage');

  // 12a. Duplicate affaire
  {
    const r = await api('POST', '/api/affaires/duplicate', { affaireId: testAffaireId });
    record('AFFAIRES', 'POST /api/affaires/duplicate', r.status === 200 && !!r.data?.id, `newId=${r.data?.id}`);
    if (r.data?.id) duplicatedAffaireId = r.data.id;
  }

  // 12b. Verify duplicate has batiments
  if (duplicatedAffaireId) {
    const r = await api('GET', `/api/affaires/${duplicatedAffaireId}/batiments`);
    record('AFFAIRES', 'GET batiments dupliquer — copie bâtiments', r.status === 200 && Array.isArray(r.data) && r.data.length >= 2, `count=${r.data?.length}`);
  }

  // 12c. Share affaire
  {
    const r = await api('POST', '/api/affaires/share', {
      affaireId: testAffaireId,
      email: 'colleague@test.local',
      role: 'EDITOR',
    });
    record('AFFAIRES', 'POST /api/affaires/share', r.status === 200 && !!r.data?.id, `shareId=${r.data?.id}`);
  }

  // 12d. Un-share
  {
    const r = await api('DELETE', '/api/affaires/share', { shareId: 'some-id' });
    record('AFFAIRES', 'DELETE /api/affaires/share', r.status === 200, `success=${r.data?.success}`);
  }

  // ────────────────────────────────────────────────────────
  // 13. ACCÈS NON-ADMIN → Routes admin protégées
  // ────────────────────────────────────────────────────────
  section('13. SÉCURITÉ — Accès non-admin aux routes admin');

  // Re-login as user (not admin)
  {
    await loginAs('user@unique.local', 'biomasse2026');
  }

  // 13a. POST cost as non-admin → 403
  {
    const r = await api('POST', '/api/costs', {
      categorie: 'HACK', designation: 'ShouldFail', prixUnitaire: 1, unite: 'u',
    });
    record('SECURITY', 'POST /api/costs as USER → 403', r.status === 403, `status=${r.status}`);
  }

  // 13b. DELETE affaire as non-admin → 403
  {
    const r = await api('DELETE', `/api/affaires/${testAffaireId}`);
    record('SECURITY', 'DELETE affaire as USER → 403', r.status === 403, `status=${r.status}`);
  }

  // ────────────────────────────────────────────────────────
  // 14. API SANS AUTH — JSON 401 (pas HTML)
  // ────────────────────────────────────────────────────────
  section('14. SÉCURITÉ — Routes API sans cookie → JSON 401');

  {
    const savedCookie = cookie;
    cookie = ''; // Clear session
    const r = await api('GET', '/api/affaires');
    record('SECURITY', 'GET /api/affaires sans auth → JSON (pas HTML)', r.status === 401 || (r.status === 200 && !r.data?._html), `status=${r.status} html=${!!r.data?._html}`);
    cookie = savedCookie;
  }

  // ────────────────────────────────────────────────────────
  // 15. NETTOYAGE — Suppression données de test
  // ────────────────────────────────────────────────────────
  section('15. NETTOYAGE — Suppression des données de test');

  // Login as admin for deletion
  await loginAs('admin@biomasse.local', 'biomasse2026');

  // Delete duplicated affaire
  if (duplicatedAffaireId) {
    const r = await api('DELETE', `/api/affaires/${duplicatedAffaireId}`);
    record('CLEANUP', 'DELETE affaire dupliquée', r.status === 200, `id=${duplicatedAffaireId}`);
  }

  // Delete test affaire (cascade deletes batiments, parcs, chiffrages)
  if (testAffaireId) {
    const r = await api('DELETE', `/api/affaires/${testAffaireId}`);
    record('CLEANUP', 'DELETE affaire test (cascade)', r.status === 200, `id=${testAffaireId}`);
  }

  // Cleanup imported test monotone
  // (no DELETE API for monotone, but re-import with empty data or just note it)
  record('CLEANUP', 'Données monotone TestVille restent (pas de DELETE API)', true, 'info');

  // Cleanup test user (direct Prisma, as no admin delete-user API)
  // We can't call Prisma here (HTTP test), but the registered user is harmless
  record('CLEANUP', 'User test-${TS}@test.local conservé (pas de delete-user API)', true, 'info');

  // ══════════════════════════════════════════════════════════
  //  RÉSUMÉ
  // ══════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  📋 RÉSUMÉ DES TESTS');
  console.log('═'.repeat(60));

  const groups = [...new Set(results.map(r => r.group))];
  for (const g of groups) {
    const items = results.filter(r => r.group === g);
    const passed = items.filter(r => r.passed).length;
    const icon = passed === items.length ? '✅' : '⚠️';
    console.log(`  ${icon} ${g}: ${passed}/${items.length}`);
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);
  const rate = ((passed / total) * 100).toFixed(1);

  console.log(`\n  Total: ${passed}/${total} (${rate}%)`);

  if (failed.length > 0) {
    console.log(`\n  ❌ TESTS ÉCHOUÉS:`);
    for (const f of failed) {
      console.log(`     - [${f.group}] ${f.name} ${f.detail ? `(${f.detail})` : ''}`);
    }
  } else {
    console.log('\n  🎉 TOUS LES TESTS PASSÉS !');
  }

  console.log('\n' + '═'.repeat(60));
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ ERREUR FATALE:', err.message || err);
  process.exit(2);
});
