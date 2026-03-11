// Comprehensive route & auth test for Biomasse app 
const http = require('http');

const BASE = 'http://localhost:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    if (options.body) {
      opts.headers['Content-Type'] = 'application/json';
    }
    
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json: () => { try { return JSON.parse(body); } catch { return null; } }
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}`);
    failed++;
  }
}

async function main() {
  console.log('\n=== TEST 1: Auth Middleware — Protected routes redirect ===');
  {
    const res = await request('/dashboard');
    // Should redirect to login (302 or serve login page)
    const redirectsToLogin = res.status === 307 || res.status === 302 || 
      (res.headers.location && res.headers.location.includes('/auth/login')) ||
      res.body.includes('login');
    assert(redirectsToLogin, `GET /dashboard redirects when unauthenticated (status=${res.status}, location=${res.headers.location || 'none'})`);
  }

  {
    const res = await request('/affaires');
    const redirectsToLogin = res.status === 307 || res.status === 302 ||
      (res.headers.location && res.headers.location.includes('/auth/login'));
    assert(redirectsToLogin, `GET /affaires redirects when unauthenticated (status=${res.status})`);
  }

  console.log('\n=== TEST 2: Auth Middleware — Public routes accessible ===');
  {
    const res = await request('/');
    assert(res.status === 200, `GET / is accessible (status=${res.status})`);
  }
  {
    const res = await request('/auth/login');
    assert(res.status === 200, `GET /auth/login is accessible (status=${res.status})`);
  }

  console.log('\n=== TEST 3: Auth Middleware — API routes protected ===');
  {
    const res = await request('/api/affaires');
    // API routes should return 401 or redirect
    assert(res.status === 401 || res.status === 307 || res.status === 302, 
      `GET /api/affaires protected (status=${res.status})`);
  }

  console.log('\n=== TEST 4: Login with correct credentials ===');
  let sessionCookie = null;
  {
    // Get CSRF token first
    const csrfRes = await request('/api/auth/csrf');
    const csrfData = csrfRes.json();
    const csrfToken = csrfData ? csrfData.csrfToken : null;
    assert(csrfToken, `Got CSRF token: ${csrfToken ? csrfToken.substring(0, 10) + '...' : 'null'}`);

    if (csrfToken) {
      // Login
      const loginRes = await request('/api/auth/callback/credentials', {
        method: 'POST',
        body: {
          email: 'user@unique.local',
          password: 'biomasse2026',
          csrfToken,
          json: true,
        },
        headers: {
          'Cookie': csrfRes.headers['set-cookie'] ? csrfRes.headers['set-cookie'].join('; ') : ''
        }
      });
      
      // NextAuth redirects on success (302)
      assert(loginRes.status === 200 || loginRes.status === 302, 
        `Login POST returned ${loginRes.status}`);
      
      // Extract session cookie
      const cookies = loginRes.headers['set-cookie'];
      if (cookies) {
        sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
        assert(sessionCookie.includes('next-auth'), `Got session cookie`);
      } else {
        console.log('  ⚠ No set-cookie in login response');
      }
    }
  }

  // If we got a session, test authenticated routes
  if (sessionCookie) {
    console.log('\n=== TEST 5: Authenticated access to protected routes ===');
    {
      const res = await request('/api/affaires', { headers: { 'Cookie': sessionCookie } });
      assert(res.status === 200, `GET /api/affaires authenticated (status=${res.status})`);
      const data = res.json();
      assert(Array.isArray(data), `Returns array of affaires`);
    }

    console.log('\n=== TEST 6: Create affaire ===');
    let affaireId = null;
    {
      const res = await request('/api/affaires', {
        method: 'POST',
        body: {
          referenceAffaire: 'TEST-AUTH-001',
          nomClient: 'Test Client Auth',
          ville: 'Paris',
          departement: '75',
        },
        headers: { 'Cookie': sessionCookie }
      });
      assert(res.status === 200 || res.status === 201, `POST /api/affaires (status=${res.status})`);
      const data = res.json();
      if (data && data.id) {
        affaireId = data.id;
        assert(true, `Created affaire: ${affaireId}`);
      } else {
        console.log('  ⚠ Response:', JSON.stringify(data).substring(0, 200));
      }
    }

    if (affaireId) {
      console.log('\n=== TEST 7: Get affaire detail ===');
      {
        const res = await request(`/api/affaires/${affaireId}`, { headers: { 'Cookie': sessionCookie } });
        assert(res.status === 200, `GET /api/affaires/${affaireId} (status=${res.status})`);
        const data = res.json();
        assert(data && data.referenceAffaire, `Reference exists: ${data ? data.referenceAffaire : 'null'}`);
      }

      console.log('\n=== TEST 8: Add batiment ===');
      {
        const res = await request(`/api/affaires/${affaireId}/batiments`, {
          method: 'POST',
          body: {
            batiments: [{
              numero: 1,
              designation: 'Bat Test Auth',
              typeBatiment: 'LOGEMENTS',
              surfaceChauffee: 500,
              deperditions: 50,
              rendementProduction: 85,
              rendementDistribution: 95,
              rendementEmission: 95,
              rendementRegulation: 95,
              consommationsReelles: 100000,
              typeEnergie: 'GAZ_NATUREL',
              tarification: 0.08,
              abonnement: 500,
              refTarification: 0.09,
              refAbonnement: 550,
            }]
          },
          headers: { 'Cookie': sessionCookie }
        });
        assert(res.status === 200 || res.status === 201, `POST batiments (status=${res.status})`);
        const data = res.json();
        console.log('  Batiment response:', JSON.stringify(data).substring(0, 300));
        if (data) {
          assert(data.length >= 1 || data.batiments, `Batiments returned`);
        }
      }

      console.log('\n=== TEST 9: Run calculations ===');
      {
        const res = await request(`/api/calculs/${affaireId}`, { headers: { 'Cookie': sessionCookie } });
        assert(res.status === 200, `GET /api/calculs/${affaireId} (status=${res.status})`);
        const data = res.json();
        if (data) {
          assert(data.parc || data.batiments, `Calculations returned data`);
          if (data.batiments && data.batiments[0]) {
            const bat = data.batiments[0];
            console.log(`    Bat: conso=${bat.consommation}, puissance=${bat.puissance}`);
          }
          if (data.parc) {
            console.log(`    Parc: puissanceTotale=${data.parc.puissanceTotale}, couverture=${data.parc.couvertureBiomasse}`);
          }
        } else {
          console.log('  ⚠ Empty calcul response');
        }
      }

      console.log('\n=== TEST 10: Delete test affaire ===');
      {
        const res = await request(`/api/affaires/${affaireId}`, {
          method: 'DELETE',
          headers: { 'Cookie': sessionCookie }
        });
        assert(res.status === 200 || res.status === 204, `DELETE affaire (status=${res.status})`);
      }
    }

    console.log('\n=== TEST 11: Admin routes require ADMIN role ===');
    {
      const res = await request('/api/admin/meteo', { headers: { 'Cookie': sessionCookie } });
      // USER role should get 403
      assert(res.status === 403 || res.status === 307, `GET /api/admin/meteo forbidden for USER (status=${res.status})`);
    }
  } else {
    console.log('\n⚠ Skipping authenticated tests (no session cookie obtained)');
    // Try the API routes directly (they might use session fallback)
    console.log('\n=== TEST 5-ALT: API routes with fallback ===');
    {
      const res = await request('/api/affaires');
      console.log(`  GET /api/affaires status=${res.status}`);
      if (res.status === 200) {
        const data = res.json();
        console.log(`  Items: ${Array.isArray(data) ? data.length : 'not array'}`);
      }
    }
  }

  console.log('\n=== TEST 12: Meteo endpoint ===');
  {
    const headers = sessionCookie ? { 'Cookie': sessionCookie } : {};
    const res = await request('/api/meteo?ville=Paris', { headers });
    if (res.status === 200) {
      const data = res.json();
      assert(data && (Array.isArray(data) || data.length !== undefined), `Meteo data returned for Paris`);
    } else {
      console.log(`  GET /api/meteo?ville=Paris status=${res.status} (may need auth)`);
    }
  }

  console.log('\n=== TEST 13: Costs endpoint ===');
  {
    const headers = sessionCookie ? { 'Cookie': sessionCookie } : {};
    const res = await request('/api/costs', { headers });
    if (res.status === 200) {
      const data = res.json();
      assert(data, `Costs data returned`);
    } else {
      console.log(`  GET /api/costs status=${res.status}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
