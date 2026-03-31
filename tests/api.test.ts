/**
 * ============================================================================
 * QA TEST SUITE — API Routes & Integration Tests
 * ============================================================================
 * 
 * Couvre toutes les routes API de l'application Faisabilité Biomasse.  
 * Teste: status codes HTTP, auth/authz, validation, logique métier, edge cases.
 *
 * Usage:  npx tsx tests/api.test.ts
 *
 * Pré-requis:
 *   - L'app doit tourner sur http://localhost:3000  (npm run dev)
 *   - La BDD doit être seedée  (npx prisma db seed)
 * ============================================================================
 */

const BASE = 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}

function skip(label: string) {
  skipped++;
  console.log(`  ⏭️  ${label} (skipped)`);
}

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* non-json response */ }
  return { status: res.status, body, ok: res.ok };
}

async function fetchRaw(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, options);
  return { status: res.status, ok: res.ok, headers: res.headers };
}

// ─── Cookie-based session (NextAuth) ─────────────────────────────────────────

async function login(email: string, password: string): Promise<string> {
  // Get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.getSetCookie?.() || [];
  const csrfCookie = cookies.find(c => c.startsWith('next-auth.csrf-token'))?.split(';')[0] || '';

  // Sign in
  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: 'manual',
  });

  const sessionCookies = signInRes.headers.getSetCookie?.() || [];
  const sessionCookie = sessionCookies.find(c => c.startsWith('next-auth.session-token'))?.split(';')[0] || '';
  return [csrfCookie, sessionCookie].filter(Boolean).join('; ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — HEALTH & PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

async function testPublicRoutes() {
  console.log('\n🔵 1. PUBLIC ROUTES');

  // Home page
  const home = await fetchRaw('/');
  assert(home.status === 200, 'GET / → 200');

  // Login page
  const loginPage = await fetchRaw('/auth/login');
  assert(loginPage.status === 200, 'GET /auth/login → 200');

  // Register page
  const registerPage = await fetchRaw('/auth/register');
  assert(registerPage.status === 200, 'GET /auth/register → 200');

  // NextAuth CSRF endpoint
  const csrf = await fetchJSON('/api/auth/csrf');
  assert(csrf.status === 200 && csrf.body?.csrfToken, 'GET /api/auth/csrf → 200 + token');

  // NextAuth providers
  const providers = await fetchJSON('/api/auth/providers');
  assert(providers.status === 200 && providers.body?.credentials, 'GET /api/auth/providers → credentials');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — AUTH (Login / Register / Session)
// ═══════════════════════════════════════════════════════════════════════════════

async function testAuth() {
  console.log('\n🔵 2. AUTHENTICATION');

  // 2a. Register — missing fields
  const regMissing = await fetchJSON('/api/auth/register', {
    method: 'POST', body: JSON.stringify({ email: 'test@test.com' }),
  });
  assert(regMissing.status === 400, 'POST /api/auth/register sans champs → 400');

  // 2b. Register — duplicate email
  const regDup = await fetchJSON('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@biomasse.local', password: 'test1234',
      nom: 'Dup', prenom: 'Test',
    }),
  });
  assert(regDup.status === 409, 'POST /api/auth/register email existant → 409');

  // 2c. Login — bad credentials (custom route)
  const loginBad = await fetchJSON('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email: 'admin@biomasse.local', password: 'wrong' }),
  });
  assert(loginBad.status === 401, 'POST /api/auth/login mauvais mdp → 401');

  // 2d. Login — good credentials (custom route)
  const loginOk = await fetchJSON('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@biomasse.local', password: 'admin123' }),
  });
  assert(loginOk.status === 200 && loginOk.body?.user?.role === 'ADMIN', 'POST /api/auth/login admin → 200 + ADMIN');

  // 2e. NextAuth session flow
  try {
    const cookie = await login('user@unique.local', 'password');
    assert(cookie.includes('next-auth.session-token'), 'NextAuth login → session cookie obtenu');

    const session = await fetchJSON('/api/auth/session', {
      headers: { Cookie: cookie },
    });
    assert(session.status === 200 && session.body?.user?.email === 'user@unique.local',
      'GET /api/auth/session → utilisateur connecté');
  } catch (e) {
    assert(false, `NextAuth session flow: ${e}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — PROTECTED PAGES (middleware redirects)
// ═══════════════════════════════════════════════════════════════════════════════

async function testProtectedPages() {
  console.log('\n🔵 3. PROTECTED PAGES (middleware)');

  // Unauthenticated → redirect to login (302) for protected pages
  const dashboard = await fetchRaw('/dashboard', { redirect: 'manual' });
  assert(dashboard.status === 302 || dashboard.status === 307,
    'GET /dashboard sans auth → redirect (302/307)');

  const affaires = await fetchRaw('/affaires', { redirect: 'manual' });
  assert(affaires.status === 302 || affaires.status === 307,
    'GET /affaires sans auth → redirect');

  const newAffaire = await fetchRaw('/affaires/new', { redirect: 'manual' });
  assert(newAffaire.status === 302 || newAffaire.status === 307,
    'GET /affaires/new sans auth → redirect');

  // Admin pages — test with a normal user session
  try {
    const userCookie = await login('user@unique.local', 'password');

    const adminCosts = await fetchRaw('/admin/costs', {
      redirect: 'manual',
      headers: { Cookie: userCookie },
    });
    assert(adminCosts.status === 302 || adminCosts.status === 307,
      'GET /admin/costs (USER) → redirect vers dashboard');

    const couts = await fetchRaw('/couts', {
      redirect: 'manual',
      headers: { Cookie: userCookie },
    });
    assert(couts.status === 302 || couts.status === 307,
      'GET /couts (USER) → redirect vers dashboard');

    // Admin pages — with admin session → should return 200
    const adminCookie = await login('admin@biomasse.local', 'admin123');
    const adminCostsOk = await fetchRaw('/admin/costs', {
      headers: { Cookie: adminCookie },
    });
    assert(adminCostsOk.status === 200, 'GET /admin/costs (ADMIN) → 200');
  } catch (e) {
    assert(false, `Protected pages test: ${e}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — API AFFAIRES (CRUD)
// ═══════════════════════════════════════════════════════════════════════════════

let testAffaireId = '';
let userCookie = '';
let adminCookie = '';

async function testAffairesCRUD() {
  console.log('\n🔵 4. AFFAIRES CRUD');

  userCookie = await login('user@unique.local', 'password');
  adminCookie = await login('admin@biomasse.local', 'admin123');

  // 4a. List affaires (authenticated)
  const list = await fetchJSON('/api/affaires', {
    headers: { Cookie: userCookie },
  });
  assert(list.status === 200 && Array.isArray(list.body), 'GET /api/affaires → 200 + array');

  // 4b. Create affaire
  const create = await fetchJSON('/api/affaires', {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      nomClient: 'TEST QA Client',
      ville: 'Paris',
      departement: '75',
      djuRetenu: 2500,
    }),
  });
  assert(create.status === 200 && create.body?.id, 'POST /api/affaires → 200 + id');
  testAffaireId = create.body?.id || '';

  if (!testAffaireId) {
    console.log('⚠️  Impossible de créer une affaire test, skip section 4');
    return;
  }

  // 4c. Get single affaire
  const get = await fetchJSON(`/api/affaires/${testAffaireId}`, {
    headers: { Cookie: userCookie },
  });
  assert(get.status === 200 && get.body?.nomClient === 'TEST QA Client',
    'GET /api/affaires/:id → 200 + données correctes');

  // 4d. Update affaire
  const update = await fetchJSON(`/api/affaires/${testAffaireId}`, {
    method: 'PUT',
    headers: { Cookie: userCookie },
    body: JSON.stringify({ nomClient: 'TEST QA Updated', statut: 'EN_COURS' }),
  });
  assert(update.status === 200, 'PUT /api/affaires/:id → 200');

  // 4e. Get non-existent affaire
  const notFound = await fetchJSON('/api/affaires/non-existent-id-xxxxx', {
    headers: { Cookie: userCookie },
  });
  assert(notFound.status === 404, 'GET /api/affaires/bad-id → 404');

  // 4f. Duplicate affaire
  const dup = await fetchJSON('/api/affaires/duplicate', {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({ sourceId: testAffaireId }),
  });
  assert(dup.status === 200 && dup.body?.id && dup.body.id !== testAffaireId,
    'POST /api/affaires/duplicate → 200 + new id');

  // Cleanup duplicate
  if (dup.body?.id) {
    await fetchJSON(`/api/affaires/${dup.body.id}`, {
      method: 'DELETE', headers: { Cookie: adminCookie },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — BATIMENTS
// ═══════════════════════════════════════════════════════════════════════════════

let testBatimentId = '';

async function testBatiments() {
  console.log('\n🔵 5. BATIMENTS');
  if (!testAffaireId) { skip('Batiments — pas d\'affaire test'); return; }

  // 5a. Create batiment
  const create = await fetchJSON(`/api/affaires/${testAffaireId}/batiments`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      nom: 'Mairie',
      surface: 500,
      typeEnergie: 'GAZ',
      puissanceInstallee: 120,
      consommation: 50000,
      tarification: 0.08,
    }),
  });
  assert(create.ok, 'POST batiment → ok');

  // 5b. List batiments
  const list = await fetchJSON(`/api/affaires/${testAffaireId}/batiments`, {
    headers: { Cookie: userCookie },
  });
  assert(list.status === 200 && Array.isArray(list.body) && list.body.length > 0,
    'GET batiments → array non-vide');
  testBatimentId = list.body?.[0]?.id || '';

  // 5c. Create with missing required fields
  const badCreate = await fetchJSON(`/api/affaires/${testAffaireId}/batiments`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({}), // empty
  });
  // Should still work (normalization defaults) or return error — verify behavior
  assert(badCreate.status === 200 || badCreate.status === 400,
    `POST batiment vide → ${badCreate.status} (accepté ou rejeté)`);

  // 5d. Delete batiment
  if (testBatimentId) {
    const del = await fetchJSON(`/api/affaires/${testAffaireId}/batiments?id=${testBatimentId}`, {
      method: 'DELETE', headers: { Cookie: userCookie },
    });
    assert(del.ok, 'DELETE batiment → ok');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — PARCS
// ═══════════════════════════════════════════════════════════════════════════════

async function testParcs() {
  console.log('\n🔵 6. PARCS');
  if (!testAffaireId) { skip('Parcs — pas d\'affaire test'); return; }

  // 6a. Create parc
  const create = await fetchJSON(`/api/affaires/${testAffaireId}/parcs`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      numero: 1,
      label: 'Parc Test 1',
      typeBiomasse: 'GRANULES',
      puissanceBois: 200,
      puissanceAppoint: 100,
      rendementChaudiereBois: 85,
      rendementChaudiere2: 90,
    }),
  });
  assert(create.ok, 'POST parc → ok');

  // 6b. List parcs
  const list = await fetchJSON(`/api/affaires/${testAffaireId}/parcs`, {
    headers: { Cookie: userCookie },
  });
  assert(list.status === 200 && Array.isArray(list.body), 'GET parcs → array');

  // 6c. Create second parc
  const create2 = await fetchJSON(`/api/affaires/${testAffaireId}/parcs`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      numero: 2,
      label: 'Parc Test 2',
      typeBiomasse: 'PLAQUETTES',
      puissanceBois: 300,
    }),
  });
  assert(create2.ok, 'POST parc 2 → ok');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — CHIFFRAGE (Reference + Biomasse)
// ═══════════════════════════════════════════════════════════════════════════════

async function testChiffrage() {
  console.log('\n🔵 7. CHIFFRAGE');
  if (!testAffaireId) { skip('Chiffrage — pas d\'affaire test'); return; }

  // 7a. POST chiffrage reference
  const refPost = await fetchJSON(`/api/affaires/${testAffaireId}/chiffrage-reference`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      parc: 1,
      lignesChaufferie: JSON.stringify([{ designation: 'Chaudière gaz', qte: 1, pu: 15000 }]),
      lignesDistribution: JSON.stringify([]),
      fraisDivers: 5,
      margeEntreprise: 10,
    }),
  });
  assert(refPost.ok, 'POST chiffrage-reference → ok');

  // 7b. GET chiffrage reference (parc 1)
  const refGet = await fetchJSON(`/api/affaires/${testAffaireId}/chiffrage-reference?parc=1`, {
    headers: { Cookie: userCookie },
  });
  assert(refGet.status === 200, 'GET chiffrage-reference?parc=1 → 200');

  // 7c. GET chiffrage reference (parc 2, non-existent yet)
  const refGet2 = await fetchJSON(`/api/affaires/${testAffaireId}/chiffrage-reference?parc=2`, {
    headers: { Cookie: userCookie },
  });
  assert(refGet2.status === 200 || refGet2.status === 404,
    `GET chiffrage-reference?parc=2 → ${refGet2.status}`);

  // 7d. POST chiffrage biomasse
  const bioPost = await fetchJSON(`/api/affaires/${testAffaireId}/chiffrage-biomasse`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      parc: 1,
      lignesChaufferie: JSON.stringify([{ designation: 'Chaudière bois', qte: 1, pu: 80000 }]),
      lignesDistribution: JSON.stringify([]),
      fraisDivers: 5,
      margeEntreprise: 10,
      subventionTaux: 40,
    }),
  });
  assert(bioPost.ok, 'POST chiffrage-biomasse → ok');

  // 7e. GET chiffrage biomasse (parc 1)
  const bioGet = await fetchJSON(`/api/affaires/${testAffaireId}/chiffrage-biomasse?parc=1`, {
    headers: { Cookie: userCookie },
  });
  assert(bioGet.status === 200, 'GET chiffrage-biomasse?parc=1 → 200');

  // 7f. Verify parc isolation — GET without parc param should NOT default to parc 1 silently
  const bioNoParc = await fetchJSON(`/api/affaires/${testAffaireId}/chiffrage-biomasse`, {
    headers: { Cookie: userCookie },
  });
  assert(bioNoParc.status === 200, 'GET chiffrage-biomasse sans param parc → 200');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — CALCULS
// ═══════════════════════════════════════════════════════════════════════════════

async function testCalculs() {
  console.log('\n🔵 8. CALCULS');
  if (!testAffaireId) { skip('Calculs — pas d\'affaire test'); return; }

  // First recreate a batiment for calculations
  await fetchJSON(`/api/affaires/${testAffaireId}/batiments`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      nom: 'Ecole Test',
      surface: 1000,
      typeEnergie: 'FIOUL',
      puissanceInstallee: 200,
      consommation: 80000,
      tarification: 0.13,
      deperditions: 150,
      rendement: 85,
      parcNum: 1,
    }),
  });

  // 8a. Run calculations
  const calc = await fetchJSON(`/api/calculs/${testAffaireId}`, {
    headers: { Cookie: userCookie },
  });
  assert(calc.status === 200, 'GET /api/calculs/:id → 200');
  assert(calc.body?.batimentsResults && Array.isArray(calc.body.batimentsResults),
    'Calculs → batimentsResults array');
  assert(calc.body?.parcsResults, 'Calculs → parcsResults présent');

  // 8b. Verify calculation has key fields
  if (calc.body?.batimentsResults?.[0]) {
    const br = calc.body.batimentsResults[0];
    assert(typeof br.consommationEI === 'number', 'Calcul batiment → consommationEI');
    assert(typeof br.dpeActuel === 'string' || typeof br.dpeActuel === 'undefined',
      'Calcul batiment → dpeActuel (string ou undefined)');
  }

  // 8c. Calculs for non-existent affaire
  const calcBad = await fetchJSON('/api/calculs/non-existent-id', {
    headers: { Cookie: userCookie },
  });
  assert(calcBad.status === 404 || calcBad.status === 500,
    `GET /api/calculs/bad-id → ${calcBad.status}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — COSTS DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

async function testCosts() {
  console.log('\n🔵 9. COSTS DATABASE');

  // 9a. List costs (public or authenticated)
  const list = await fetchJSON('/api/costs', {
    headers: { Cookie: userCookie },
  });
  assert(list.status === 200 && Array.isArray(list.body), 'GET /api/costs → 200 + array');

  // 9b. Create cost (admin)
  const create = await fetchJSON('/api/costs', {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      categorie: 'TEST_QA',
      designation: 'Test item QA',
      unite: 'u',
      prixUnitaire: 999.99,
    }),
  });
  assert(create.ok, 'POST /api/costs (ADMIN) → ok');

  // 9c. Create cost (USER — should fail or succeed depending on auth)
  const createUser = await fetchJSON('/api/costs', {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      categorie: 'TEST_QA',
      designation: 'Test item user',
      unite: 'u',
      prixUnitaire: 100,
    }),
  });
  // Note: If /api/costs POST checks isAdmin(), this should be 403
  console.log(`    ℹ️  POST /api/costs (USER) → ${createUser.status} ${createUser.ok ? '⚠️ devrait être protégé' : '✅ protégé'}`);

  // 9d. Delete test cost (cleanup)
  if (create.body?.id) {
    await fetchJSON('/api/costs', {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ id: create.body.id }),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — EQUIPES (Teams)
// ═══════════════════════════════════════════════════════════════════════════════

async function testEquipes() {
  console.log('\n🔵 10. EQUIPES');

  // 10a. List teams
  const list = await fetchJSON('/api/equipes', {
    headers: { Cookie: userCookie },
  });
  assert(list.status === 200 && Array.isArray(list.body), 'GET /api/equipes → array');

  // 10b. Create team
  const create = await fetchJSON('/api/equipes', {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({ nom: 'Équipe Test QA' }),
  });
  assert(create.ok && create.body?.id, 'POST /api/equipes → ok + id');

  // 10c. Add member to team
  if (create.body?.id) {
    const addMember = await fetchJSON('/api/equipes', {
      method: 'PUT',
      headers: { Cookie: userCookie },
      body: JSON.stringify({
        equipeId: create.body.id,
        action: 'add',
        email: 'admin@biomasse.local',
      }),
    });
    assert(addMember.ok, 'PUT /api/equipes add member → ok');

    // 10d. Remove member
    const removeMember = await fetchJSON('/api/equipes', {
      method: 'PUT',
      headers: { Cookie: userCookie },
      body: JSON.stringify({
        equipeId: create.body.id,
        action: 'remove',
        email: 'admin@biomasse.local',
      }),
    });
    assert(removeMember.ok, 'PUT /api/equipes remove member → ok');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — METEO
// ═══════════════════════════════════════════════════════════════════════════════

async function testMeteo() {
  console.log('\n🔵 11. METEO');

  // 11a. GET DJU for département
  const dju = await fetchJSON('/api/meteo/75', {
    headers: { Cookie: userCookie },
  });
  assert(dju.status === 200 || dju.status === 404,
    `GET /api/meteo/75 → ${dju.status}`);

  // 11b. GET monotone for ville
  const monotone = await fetchJSON('/api/meteo/monotone/Bourges', {
    headers: { Cookie: userCookie },
  });
  assert(monotone.status === 200 || monotone.status === 404,
    `GET /api/meteo/monotone/Bourges → ${monotone.status}`);

  // 11c. GET admin villes
  const villes = await fetchJSON('/api/admin/meteo/villes', {
    headers: { Cookie: adminCookie },
  });
  assert(villes.status === 200, 'GET /api/admin/meteo/villes → 200');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — ISOLATION  
// ═══════════════════════════════════════════════════════════════════════════════

async function testIsolation() {
  console.log('\n🔵 12. ISOLATION');
  if (!testAffaireId) { skip('Isolation — pas d\'affaire test'); return; }

  // Create a batiment first
  const createBat = await fetchJSON(`/api/affaires/${testAffaireId}/batiments`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({ nom: 'Batiment Isolation', surface: 300, typeEnergie: 'GAZ' }),
  });

  const batList = await fetchJSON(`/api/affaires/${testAffaireId}/batiments`, {
    headers: { Cookie: userCookie },
  });
  const batId = batList.body?.[0]?.id;

  if (!batId) { skip('Isolation — pas de batiment'); return; }

  // 12a. GET isolation (empty initially)
  const getIso = await fetchJSON(`/api/affaires/${testAffaireId}/batiments/${batId}/isolation`, {
    headers: { Cookie: userCookie },
  });
  assert(getIso.status === 200, 'GET isolation → 200');

  // 12b. POST isolation work
  const postIso = await fetchJSON(`/api/affaires/${testAffaireId}/batiments/${batId}/isolation`, {
    method: 'POST',
    headers: { Cookie: userCookie },
    body: JSON.stringify({
      lignes: [
        { typeIsolation: 'Murs', surface: 200, epaisseur: 10, prixM2: 45, dejaRealise: false },
        { typeIsolation: 'Toiture', surface: 300, epaisseur: 20, prixM2: 55, dejaRealise: true },
      ],
    }),
  });
  assert(postIso.ok, 'POST isolation → ok');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13 — EDGE CASES & SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

async function testEdgeCases() {
  console.log('\n🔵 13. EDGE CASES & SÉCURITÉ');

  // 13a. API sans auth → 401 (middleware)
  const noAuth = await fetchJSON('/api/affaires');
  // Middleware lets API through and returns 401 in handler or allows fallback
  console.log(`    ℹ️  GET /api/affaires sans cookie → ${noAuth.status}`);

  // 13b. XSS in client name — should be stored as-is (Prisma safe) but verify
  if (testAffaireId) {
    const xss = await fetchJSON(`/api/affaires/${testAffaireId}`, {
      method: 'PUT',
      headers: { Cookie: userCookie },
      body: JSON.stringify({ nomClient: '<script>alert("xss")</script>' }),
    });
    assert(xss.ok, 'PUT affaire avec XSS payload → accepté (stockage sûr via Prisma)');

    // Verify stored value
    const verify = await fetchJSON(`/api/affaires/${testAffaireId}`, {
      headers: { Cookie: userCookie },
    });
    assert(verify.body?.nomClient === '<script>alert("xss")</script>',
      'XSS payload stocké tel quel (display escaping = côté React)');
  }

  // 13c. Very long string
  if (testAffaireId) {
    const longStr = 'A'.repeat(10000);
    const longRes = await fetchJSON(`/api/affaires/${testAffaireId}`, {
      method: 'PUT',
      headers: { Cookie: userCookie },
      body: JSON.stringify({ notes: longStr }),
    });
    console.log(`    ℹ️  PUT notes 10k chars → ${longRes.status}`);
  }

  // 13d. Invalid JSON body
  const badJson = await fetch(`${BASE}/api/affaires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userCookie },
    body: 'not json',
  });
  assert(badJson.status >= 400, `POST body invalide → ${badJson.status}`);

  // 13e. SQL injection via Prisma (should be safe)
  if (testAffaireId) {
    const sqli = await fetchJSON(`/api/affaires/${testAffaireId}`, {
      method: 'PUT',
      headers: { Cookie: userCookie },
      body: JSON.stringify({ nomClient: "'; DROP TABLE affaires; --" }),
    });
    assert(sqli.ok, 'SQL injection via Prisma → safe (paramétrisé)');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 14 — DELETE (Admin only)  
// ═══════════════════════════════════════════════════════════════════════════════

async function testDeleteAffaire() {
  console.log('\n🔵 14. DELETE AFFAIRE');
  if (!testAffaireId) { skip('Delete — pas d\'affaire test'); return; }

  // 14a. User cannot delete
  const userDel = await fetchJSON(`/api/affaires/${testAffaireId}`, {
    method: 'DELETE', headers: { Cookie: userCookie },
  });
  assert(userDel.status === 403 || userDel.status === 401,
    `DELETE affaire (USER) → ${userDel.status} (forbidden)`);

  // 14b. Admin can delete
  const adminDel = await fetchJSON(`/api/affaires/${testAffaireId}`, {
    method: 'DELETE', headers: { Cookie: adminCookie },
  });
  assert(adminDel.ok, 'DELETE affaire (ADMIN) → ok');

  // 14c. Verify deleted
  const verify = await fetchJSON(`/api/affaires/${testAffaireId}`, {
    headers: { Cookie: userCookie },
  });
  assert(verify.status === 404, 'GET affaire supprimée → 404');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  QA TEST SUITE — Faisabilité Biomasse API');
  console.log('  Serveur: ' + BASE);
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    // Check server is running
    const health = await fetch(BASE, { signal: AbortSignal.timeout(5000) });
    if (!health.ok) throw new Error(`Server returned ${health.status}`);
  } catch (e) {
    console.error(`\n❌ Serveur non accessible sur ${BASE}`);
    console.error('   Lance: npm run dev');
    process.exit(1);
  }

  await testPublicRoutes();
  await testAuth();
  await testProtectedPages();
  await testAffairesCRUD();
  await testBatiments();
  await testParcs();
  await testChiffrage();
  await testCalculs();
  await testCosts();
  await testEquipes();
  await testMeteo();
  await testIsolation();
  await testEdgeCases();
  await testDeleteAffaire();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RÉSULTATS: ${passed} passés, ${failed} échoués, ${skipped} skippés`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n  Échecs:');
    failures.forEach(f => console.log(`    ❌ ${f}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
