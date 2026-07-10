/**
 * Vérification runtime de bout en bout contre les valeurs du classeur Excel.
 * Nécessite l'app démarrée (npm start) et une base seedée.
 * Reproduit l'étude du classeur (bâtiments 1 & 2 de la feuille Donnees) via l'API HTTP
 * réelle (session NextAuth) et compare chaque résultat aux cellules Excel.
 * Usage : BASE_URL=http://localhost:3105 ADMIN_PASSWORD=... npx tsx scripts/verify-runtime-e2e.ts
 */

const BASE = process.env.BASE_URL || 'http://localhost:3105';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@biomasse.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VerifTest2026!';

let pass = 0, fail = 0;
const failures: string[] = [];
function check(label: string, actual: number, expected: number, tolPct = 0.0001) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= Math.abs(expected) * tolPct + 1e-6;
  if (ok) { pass++; console.log(`✓ ${label}: ${actual}`); }
  else { fail++; failures.push(label); console.log(`✗ ${label}: obtenu=${actual} attendu(Excel)=${expected}`); }
}

// Mini cookie jar
const jar = new Map<string, string>();
function storeCookies(res: Response) {
  const raw = (res.headers as any).getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}
function cookieHeader() {
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}
async function http(pathname: string, init: RequestInit = {}) {
  const res = await fetch(BASE + pathname, {
    ...init,
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader(), ...(init.headers || {}) },
    redirect: 'manual',
  });
  storeCookies(res);
  return res;
}

async function main() {
  // ── Login NextAuth (credentials) ──
  const csrfRes = await http('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const loginRes = await http('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader() },
    body: new URLSearchParams({ csrfToken, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, json: 'true' }).toString(),
  });
  if (![200, 302].includes(loginRes.status) || !cookieHeader().includes('session-token')) {
    console.error('✗ Login impossible — statut', loginRes.status);
    process.exit(1);
  }
  console.log('✓ Session NextAuth ouverte');

  // ── Création de l'affaire (Cher → DJU 2004,1 auto) ──
  const affRes = await http('/api/affaires', {
    method: 'POST',
    body: JSON.stringify({ nomClient: 'VERIF-EXCEL-E2E', ville: 'Bourges', departement: '18' }),
  });
  const affaire = await affRes.json();
  if (!affaire.id) { console.error('✗ Création affaire échouée', affaire); process.exit(1); }
  check('DJU résolu automatiquement depuis le département 18 (Meteo!AD Cher)', affaire.djuRetenu, 2004.1);

  // Aligner les paramètres sur le classeur (DJU 1977, Tint 19, Text −7) pour comparer aux cellules
  await http(`/api/affaires/${affaire.id}`, {
    method: 'PUT',
    body: JSON.stringify({ djuRetenu: 1977, tempIntBase: 19, tempExtBase: -7, villeMonotone: 'Bourges' }),
  });

  // ── Bâtiments du classeur (feuille Donnees, lignes 6 et 5) ──
  const batiments = [
    {
      numero: 1, designation: 'Bâtiment 1', typeBatiment: 'LOGEMENTS',
      surfaceChauffee: 100, volumeChauffe: 300, parc: 1,
      deperditions: 10, rendementProduction: 80, rendementDistribution: 90,
      rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
      consommationsCalculees: null, consommationsReelles: 32000,
      typeEnergie: 'FUEL', tarification: 0.13, abonnement: 0,
      refDeperditions: 10, refTypeEnergie: 'GAZ_NATUREL',
      refRendementProduction: 80, refRendementDistribution: 90,
      refRendementEmission: 90, refRendementRegulation: 90,
      refTarification: 0.0978, refAbonnement: 0,
    },
    {
      numero: 2, designation: 'Bâtiment 2', typeBatiment: 'BUREAUX',
      surfaceChauffee: 200, volumeChauffe: 500, parc: 2,
      deperditions: 20, rendementProduction: 85, rendementDistribution: 90,
      rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
      consommationsCalculees: null, consommationsReelles: 60000,
      typeEnergie: 'ELECTRICITE', tarification: 0.226, abonnement: 0,
      refDeperditions: 20, refTypeEnergie: 'GAZ_NATUREL',
      refRendementProduction: 85, refRendementDistribution: 90,
      refRendementEmission: 90, refRendementRegulation: 90,
      refTarification: 0.0978, refAbonnement: 0,
    },
  ];
  const batRes = await http(`/api/affaires/${affaire.id}/batiments`, {
    method: 'POST', body: JSON.stringify({ batiments }),
  });
  if (batRes.status !== 200) { console.error('✗ Enregistrement bâtiments', batRes.status, await batRes.text()); process.exit(1); }
  console.log('✓ 2 bâtiments enregistrés (données du classeur)');

  // ── Chiffrage référence parc 1 = chiffrage_ref_Parc1 du classeur ──
  const chRefRes = await http(`/api/affaires/${affaire.id}/chiffrage-reference`, {
    method: 'POST',
    body: JSON.stringify({
      parcNumero: 1,
      travauxChaufferie: [
        { id: '1', designation: 'Installation / remplacement de chaudières', unite: 'U', qte: 5, pu: 5000 },
        { id: '2', designation: 'Installation réseau hydraulique dans bât existants', unite: 'U', qte: 0, pu: 0 },
        { id: '3', designation: 'Autre travaux de chauffage', unite: 'U', qte: 0, pu: 0 },
      ],
      bureauControle: 0, maitriseOeuvre: 0.13, fraisDivers: 0.02, aleas: 0.05,
      montantP2: 750, emprunt_ref: 9118.96,
    }),
  });
  if (chRefRes.status !== 200) { console.error('✗ Chiffrage référence', chRefRes.status, await chRefRes.text()); process.exit(1); }
  console.log('✓ Chiffrage référence parc 1 enregistré (25 000 € + frais 20 %)');

  // ── Calculs complets via l'API réelle ──
  const calcRes = await http(`/api/calculs/${affaire.id}`);
  const calc = await calcRes.json();
  const b1 = calc.batiments.find((b: any) => b.numero === 1);
  const b2 = calc.batiments.find((b: any) => b.numero === 2);

  // Retour client : consommations calculées + comparatif
  check('B1 conso calculée (Donnees!P6)', b1.conso_calculee, 31464);
  check('B1 conso réelle (Donnees!Q6)', b1.conso_reelle, 32000);
  check('B1 écart réelles/calculées (UserForm TextBox15)', b1.ecart_conso_pct, 0.01675);
  check('B2 conso calculée (Donnees!P5)', b2.conso_calculee, 58868);
  check('B2 écart réelles/calculées', b2.ecart_conso_pct, (60000 - 58868) / 60000);
  // kWhep, coûts, référence
  check('B1 conso kWhep (R6 = réelles)', b1.conso_kwhep, 32000);
  check('B2 conso kWhep élec ×2,3 (R5)', b2.conso_kwhep, 138000);
  check('B1 coût annuel initial (X6)', b1.cout_annuel, 4090.32);
  check('B2 coût annuel initial (X5)', b2.cout_annuel, 13304.168);
  check('B1 conso réf calculées (AE6)', b1.conso_ref_calculees, 31291.5479582146);
  check('B2 conso réf calculées (AE5)', b2.conso_ref_calculees, 58901.7373331099);
  check('B1 conso sortie chaudières réf (AH6)', b1.conso_sortie_chaudieres_ref, 25033.23836657168);
  check('B2 conso sortie chaudières réf (AH5)', b2.conso_sortie_chaudieres_ref, 50066.47673314341);

  // Agrégation par parc = feuille Donnees_biomasse
  const p1 = calc.parcAgregation.find((p: any) => p.parc === 1);
  const p2 = calc.parcAgregation.find((p: any) => p.parc === 2);
  check('Parc 1 puissance chauffage (Donnees_biomasse B2)', p1.puissance_kW, 10);
  check('Parc 2 puissance chauffage (Donnees_biomasse B3)', p2.puissance_kW, 20);
  check('Parc 1 conso bâtiments (Donnees_biomasse G2 = 25 033)', p1.conso_kWh, 25033.23836657168);
  check('Parc 2 conso bâtiments (Donnees_biomasse G3 = 50 066)', p2.conso_kWh, 50066.47673314341);

  // Chiffrage = chiffrage_ref_Parc1
  const ch1 = calc.chiffrage.find((c: any) => c.parc === 1);
  check('Sous-total chaufferie (F23)', ch1.sous_total_chaufferie, 25000);
  check('Investissement HT (F35)', ch1.investissement_ht, 30000);
  check('TVA 20 % (F36)', ch1.tva, 6000);
  check('Investissement TTC (F37)', ch1.investissement_ttc, 36000);
  check('Annuité référence (solution biomasse L16)', ch1.annuite, 2607.9306666666666);

  // Coût actuel parc 1 = X6 + P2 750 (solution biomasse D12+D14)
  check('Parc 1 coût actuel (X6 + P2 750)', p1.cout_actuel, 4090.32 + 750);
  check('Parc 1 coût référence (AG + P2 750)', p1.cout_total, 31291.5479582146 * 1.1 * 0.0978 + 750, 0.001);

  // Bilan actualisé : année 1 = coût global (exploitation + annuité), année 16 − annuité
  const bilan = calc.bilanActualize;
  const an1 = bilan[0], an15 = bilan[14], an16 = bilan[15];
  const coutRefGlobalAn1 = an1.cout_reference;
  check('Bilan année 2 réf = année 1 × 1,04 (Bilan Actualisé E11)', bilan[1].cout_reference, coutRefGlobalAn1 * 1.04);
  check('Bilan année 16 réf = année 15 × 1,04 − annuité (S11)', an16.cout_reference, an15.cout_reference * 1.04 - 2607.9306666666666, 0.001);

  // Étiquette DPE : B1 = 32 000/100 = 320 kWhep/m² → E (Logements) ; B2 = 138 000/200 = 690 → F (Bureaux)
  const dpe1 = b1.etiquette_dpe, dpe2 = b2.etiquette_dpe;
  console.log(`${dpe1 === 'E' ? '✓' : '✗'} B1 étiquette DPE Logements 320 kWhep/m² = E (obtenu ${dpe1})`);
  dpe1 === 'E' ? pass++ : (fail++, failures.push('DPE B1'));
  console.log(`${dpe2 === 'F' ? '✓' : '✗'} B2 étiquette DPE Bureaux 690 kWhep/m² = F (obtenu ${dpe2})`);
  dpe2 === 'F' ? pass++ : (fail++, failures.push('DPE B2'));

  // Météo : monotone Bourges (8 760 heures)
  const monoRes = await http('/api/meteo/monotone/Bourges');
  const temps = await monoRes.json();
  check('Monotone Bourges : 8 760 heures en base', Array.isArray(temps) ? temps.length : 0, 8760, 0);

  // Nettoyage
  await http(`/api/affaires/${affaire.id}`, { method: 'DELETE' });
  console.log('✓ Affaire de test supprimée');

  console.log(`\n${fail === 0 ? '✓ RUNTIME E2E CONFORME AU CLASSEUR' : '✗ ÉCARTS RUNTIME'} — ${pass} OK / ${fail} écart(s)`);
  if (failures.length) failures.forEach(f => console.log('  • ' + f));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error('Erreur E2E :', e); process.exit(1); });
