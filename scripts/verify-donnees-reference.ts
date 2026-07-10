/**
 * Vérification indépendante des données de référence du SaaS contre l'Excel source.
 * Lit DIRECTEMENT le classeur .xlsm (pas les extraits du dépôt) et compare :
 *   Meteo (DJU + T° base 96 depts), Energies, Car_biomasse, Utile (sections réseau,
 *   villes monotone), CO2 SO2 (facteurs d'émission + TEP), BDD_cout, Etiquette (seuils DPE).
 * Usage : npx tsx scripts/verify-donnees-reference.ts
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { bddCoutsData } from '../src/lib/data/bddCouts';
import { ENERGY_TARIFS } from '../src/lib/enums';
import { EMISSION_FACTORS, TEP_TO_KWH } from '../lib/calculs/bilan';
import { PERTES_RESEAU_KW_PER_ML } from '../lib/calculs/parc';
import { calculEtiquetteEnergetique } from '../lib/calculs/batiment';

const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
const XLSM = path.join(__dirname2, '..', 'excel-source.xlsm');

let pass = 0, fail = 0;
const failures: string[] = [];
function ok(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; }
  else { fail++; failures.push(`${label}${detail ? ' — ' + detail : ''}`); console.log(`✗ ${label} ${detail}`); }
}
function close(a: number, b: number, tol = 1e-6) { return Math.abs(a - b) <= tol; }

const wb = XLSX.readFile(XLSM, { cellFormula: true, sheetStubs: true });
const cell = (sheet: string, addr: string) => wb.Sheets[sheet]?.[addr]?.v;

// ─── 1. Feuille Meteo : DJU moyenne (AD) + T° ext base (AF) des 96 départements ───
// Le seed est parsé depuis prisma/seed.ts (source des upserts en base).
const seedTxt = fs.readFileSync(path.join(__dirname2, '..', 'prisma', 'seed.ts'), 'utf-8');
function extractArray(name: string): any[] {
  const m = seedTxt.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
  if (!m) throw new Error(`array ${name} introuvable dans seed.ts`);
  return new Function(`return ${m[1]}`)();
}
const seedMeteo: Array<{ departement: string; code: string; djuMoyenne: number; tempExtBase: number }> = extractArray('meteoMoyenneData');
const seedEnergies: Array<{ nom: string; abonnement: number; tarification: number }> = extractArray('energiesData');
const seedCarac: Array<{ type: string; pci: number; masseVolumique: number; tauxHumidite: number; tauxCendre: number }> = extractArray('caracteristiquesData');
const seedEmissions: Array<{ combustible: string; co2PerKwh: number; so2PerKwh: number }> = extractArray('facteursEmissionData');
const seedPertes: Array<{ section: string; pertesKwPerMl: number }> = extractArray('pertesReseauData');

const meteoSheet = wb.Sheets['Meteo'];
const meteoRows: Array<{ nom: string; code: string; moyenne: number; base: number }> = [];
for (let r = 3; r <= 200; r++) {
  const nom = meteoSheet[`A${r}`]?.v;
  const code = meteoSheet[`B${r}`]?.v;
  const moyenne = meteoSheet[`AD${r}`]?.v;
  const base = meteoSheet[`AF${r}`]?.v;
  if (nom == null || code == null || typeof moyenne !== 'number') continue;
  meteoRows.push({ nom: String(nom).trim(), code: String(code), moyenne, base: Number(base) });
}
ok(`Meteo : ${meteoRows.length} départements dans l'Excel vs ${seedMeteo.length} au seed`, meteoRows.length === seedMeteo.length,
  `excel=${meteoRows.length} seed=${seedMeteo.length}`);

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const seedByName = new Map(seedMeteo.map(m => [norm(m.departement), m]));
let meteoOK = 0;
for (const row of meteoRows) {
  const s = seedByName.get(norm(row.nom));
  if (!s) { ok(`Meteo ${row.nom} présent au seed`, false); continue; }
  const okDju = close(s.djuMoyenne, Math.round(row.moyenne * 10) / 10, 0.051) || close(s.djuMoyenne, row.moyenne, 0.05);
  const okBase = close(s.tempExtBase, row.base, 0.001);
  if (okDju && okBase) meteoOK++;
  else ok(`Meteo ${row.nom}`, false, `DJU excel=${row.moyenne.toFixed(1)} seed=${s.djuMoyenne} ; Tbase excel=${row.base} seed=${s.tempExtBase}`);
}
ok(`Meteo : DJU + T° base identiques pour les ${meteoRows.length} départements`, meteoOK === meteoRows.length, `${meteoOK}/${meteoRows.length}`);

// ─── 2. Feuille Energies : tarifs + abonnements (B=nom, C=abonnement, D=tarif) ───
const energiesExcel: Record<string, { abo: number; tarif: number }> = {};
for (let r = 3; r <= 20; r++) {
  const nom = cell('Energies', `B${r}`);
  if (!nom) continue;
  energiesExcel[String(nom).trim()] = {
    abo: Number(cell('Energies', `C${r}`) ?? 0),
    tarif: Number(cell('Energies', `D${r}`) ?? 0),
  };
}
for (const s of seedEnergies) {
  const key = Object.keys(energiesExcel).find(k => norm(k) === norm(s.nom));
  if (!key) { ok(`Energies « ${s.nom} » existe dans l'Excel`, false); continue; }
  const e = energiesExcel[key];
  if (norm(s.nom) === norm('Gaz naturel')) {
    // Coquille Excel connue et tranchée : 0,978 → 0,0978 (décision d'audit §2.10)
    ok(`Energies gaz naturel : Excel=0,978 (coquille), seed=0,0978 (décision verrouillée)`,
      close(e.tarif, 0.978, 1e-4) && close(s.tarification, 0.0978, 1e-9), `excel=${e.tarif} seed=${s.tarification}`);
  } else {
    ok(`Energies « ${s.nom} » tarif`, close(e.tarif, s.tarification, 1e-6), `excel=${e.tarif} seed=${s.tarification}`);
    ok(`Energies « ${s.nom} » abonnement`, close(e.abo, s.abonnement, 1e-6), `excel=${e.abo} seed=${s.abonnement}`);
  }
}
// ENERGY_TARIFS (autofill UI) doit refléter la même table
const mapEnum: Record<string, string> = {
  FUEL: 'Fuel', GAZ_NATUREL: 'Gaz naturel', GAZ_PROPANE: 'Gaz propane',
  ELECTRICITE: 'Electricité', BOIS_DECHIQUETTE: 'Bois déchiquetté', BOIS_GRANULES: 'Bois granulés',
};
for (const [k, label] of Object.entries(mapEnum)) {
  const t = (ENERGY_TARIFS as any)[k];
  if (!t) continue;
  const s = seedEnergies.find(e => norm(e.nom) === norm(label));
  if (!s) continue;
  ok(`ENERGY_TARIFS.${k} aligné sur la table Energies`, close(t.tarification, s.tarification, 1e-9),
    `enum=${t.tarification} seed=${s.tarification}`);
}

// ─── 3. Car_biomasse : PCI, masse volumique, humidité, cendres (B..F, lignes 5-8) ───
const caracExcel: Record<string, number[]> = {};
for (let r = 5; r <= 12; r++) {
  const t = cell('Car_biomasse', `B${r}`);
  if (!t) continue;
  caracExcel[norm(String(t))] = [
    Number(cell('Car_biomasse', `C${r}`) ?? NaN),
    Number(cell('Car_biomasse', `D${r}`) ?? NaN),
    Number(cell('Car_biomasse', `E${r}`) ?? NaN) * 100, // % stocké en fraction
    Number(cell('Car_biomasse', `F${r}`) ?? NaN) * 100,
  ];
}
const mapCarac: Record<string, string> = { PLAQUETTE: 'Plaquette', GRANULES: 'Granulés', MISCANTHUS: 'Miscanthus', BUCHES: 'Buches' };
for (const s of seedCarac) {
  const e = caracExcel[norm(mapCarac[s.type] || s.type)];
  if (!e) { ok(`Car_biomasse ${s.type} présent dans l'Excel`, false); continue; }
  ok(`Car_biomasse ${s.type} (PCI, masse vol., humidité, cendres)`,
    close(e[0], s.pci, 1e-6) && close(e[1], s.masseVolumique, 1e-6) &&
    close(e[2], s.tauxHumidite, 1e-6) && close(e[3], s.tauxCendre, 1e-6),
    `excel=[${e.join(', ')}] seed=[${s.pci}, ${s.masseVolumique}, ${s.tauxHumidite}, ${s.tauxCendre}]`);
}

// ─── 4. Utile : sections réseau (I/J) + villes monotone (L/M) ───
const utile = wb.Sheets['Utile'];
const sectionsExcel: Record<string, number> = {};
for (let r = 2; r <= 12; r++) {
  const sec = utile[`I${r}`]?.v;
  const val = utile[`J${r}`]?.v;
  if (sec != null && typeof val === 'number') sectionsExcel[`DN${sec}`] = val;
}
ok(`Utile : ${Object.keys(sectionsExcel).length} sections dans l'Excel vs 8 au code`, Object.keys(sectionsExcel).length === 8,
  JSON.stringify(sectionsExcel));
for (const [sec, v] of Object.entries(sectionsExcel)) {
  ok(`Section ${sec} pertes kW/ml (constante moteur)`, close(PERTES_RESEAU_KW_PER_ML[sec] ?? NaN, v, 1e-9),
    `excel=${v} code=${PERTES_RESEAU_KW_PER_ML[sec]}`);
  const s = seedPertes.find(p => p.section === sec);
  ok(`Section ${sec} pertes kW/ml (seed)`, s != null && close(s.pertesKwPerMl, v, 1e-9),
    `excel=${v} seed=${s?.pertesKwPerMl}`);
}
const villesExcel: Record<string, number> = {};
for (let r = 2; r <= 14; r++) {
  const ville = utile[`L${r}`]?.v;
  const tbase = utile[`M${r}`]?.v;
  if (ville != null && typeof tbase === 'number') villesExcel[String(ville).trim()] = tbase;
}
ok(`Utile : 11 villes monotone dans l'Excel`, Object.keys(villesExcel).length === 11, JSON.stringify(villesExcel));

// ─── 5. CO2 SO2 : facteurs d'émission (J=nom, K=CO2, M=SO2) + TEP (K9) ───
const co2Sheet = wb.Sheets['CO2 SO2'];
const emissionsExcel: Record<string, { co2: number; so2: number }> = {};
for (let r = 3; r <= 8; r++) {
  const nomV = co2Sheet[`J${r}`]?.v;
  const co2 = co2Sheet[`K${r}`]?.v;
  const so2 = co2Sheet[`M${r}`]?.v;
  if (nomV != null && typeof co2 === 'number' && typeof so2 === 'number') {
    emissionsExcel[String(nomV).trim()] = { co2, so2 };
  }
}
const mapEmission: Record<string, string> = {
  Plaquette: 'Plaquette', Granulé: 'Granulé', Fuel: 'Fuel',
  'Gaz naturel': 'Gaz nat', 'Gaz propane': 'Propane', Electricité: 'Electricité',
};
for (const [codeKey, factors] of Object.entries(EMISSION_FACTORS)) {
  const excelKey = Object.keys(emissionsExcel).find(k => norm(k) === norm(mapEmission[codeKey] || codeKey));
  if (!excelKey) { ok(`CO2/SO2 « ${codeKey} » présent dans l'Excel`, false, `clés excel: ${Object.keys(emissionsExcel).join(', ')}`); continue; }
  const e = emissionsExcel[excelKey];
  ok(`Facteur CO2 ${codeKey} (constante moteur)`, close((factors as any).co2, e.co2, 1e-9), `excel=${e.co2} code=${(factors as any).co2}`);
  ok(`Facteur SO2 ${codeKey} (constante moteur)`, close((factors as any).so2, e.so2, 1e-9), `excel=${e.so2} code=${(factors as any).so2}`);
  const s = seedEmissions.find(x => norm(x.combustible) === norm(codeKey));
  ok(`Facteur CO2/SO2 ${codeKey} (seed)`, s != null && close(s.co2PerKwh, e.co2, 1e-9) && close(s.so2PerKwh, e.so2, 1e-9),
    `excel=${e.co2}/${e.so2} seed=${s?.co2PerKwh}/${s?.so2PerKwh}`);
}
ok(`TEP = ${TEP_TO_KWH} kWh (K9)`, co2Sheet['K9']?.v === TEP_TO_KWH,
  `excel K9=${co2Sheet['K9']?.v} code=${TEP_TO_KWH}`);

// ─── 6. BDD_cout : 6 familles en blocs de colonnes (B/F/J/N/R/V) ───
const bddSheet = wb.Sheets['BDD_cout'];
const BDD_BLOCKS: Array<{ categorie: string; col: string }> = [
  { categorie: 'ISOLATION', col: 'B' },
  { categorie: 'EQUIPEMENTS', col: 'F' },
  { categorie: 'VRD', col: 'J' },
  { categorie: 'GROS_OEUVRE', col: 'N' },
  { categorie: 'CHAUFFERIE_BIOMASSE', col: 'R' },
  { categorie: 'CHAUFFAGE_BATIMENTS', col: 'V' },
];
// Libellés Excel abrégés/typos → désignations normalisées du seed (décision d'audit §2.7)
const BDD_ALIAS: Record<string, string> = {
  ENSDEQUIPEMENTS: 'ENSEMBLEDEQUIPEMENTS',
  ENDUITEXTSILO: 'ENDUITEXTERIEURSILO',
  PENTEDESISLEUR: 'PENTEDESSILEUR',
  BARGEBOISINTE: 'BARDAGEBOISINTERIEUR',
  VASEEXP: 'VASEEXPANSION',
};
const normU = (s: string) => norm(String(s).replace(/²/g, '2').replace(/³/g, '3'));
const excelArticles: Array<{ categorie: string; designation: string; unite: string; prix: number | null }> = [];
for (const block of BDD_BLOCKS) {
  const colIdx = XLSX.utils.decode_col(block.col);
  for (let r = 3; r <= 100; r++) {
    const des = bddSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx })]?.v;
    if (des == null || String(des).trim() === '') continue;
    const unite = bddSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx + 1 })]?.v;
    const prix = bddSheet[XLSX.utils.encode_cell({ r: r - 1, c: colIdx + 2 })]?.v;
    excelArticles.push({
      categorie: block.categorie,
      designation: String(des).trim(),
      unite: String(unite ?? '').trim(),
      prix: typeof prix === 'number' ? prix : null,
    });
  }
}
const seedByKey = new Map(bddCoutsData.map((a: any) => [`${a.categorie}|${norm(a.designation)}`, a]));
let bddMatched = 0, bddPriceMismatch = 0;
const bddMissing: string[] = [];
for (const art of excelArticles) {
  if (art.prix == null) { // cellule prix vide (ex. Enrobé) — exclu du seed par décision d'audit
    ok(`BDD_cout « ${art.designation} » (${art.categorie}) sans prix dans l'Excel → absent du seed (décision §2.7)`,
      !seedByKey.has(`${art.categorie}|${norm(art.designation)}`));
    continue;
  }
  const key = BDD_ALIAS[norm(art.designation)] || norm(art.designation);
  const s = seedByKey.get(`${art.categorie}|${key}`);
  if (!s) { bddMissing.push(`${art.categorie}/${art.designation} (${art.prix} €)`); continue; }
  const okPrix = close(Number((s as any).prixUnitaire), art.prix, 0.001);
  const okUnite = normU((s as any).unite) === normU(art.unite);
  if (okPrix && okUnite) bddMatched++;
  else { bddPriceMismatch++; failures.push(`BDD_cout « ${art.designation} » (${art.categorie}) : excel=${art.prix} ${art.unite} seed=${(s as any).prixUnitaire} ${(s as any).unite}`); }
}
const excelPriced = excelArticles.filter(a => a.prix != null).length;
ok(`BDD_cout : les ${excelPriced} articles Excel avec prix sont tous au seed`, bddMissing.length === 0,
  `manquants (${bddMissing.length}) : ${bddMissing.slice(0, 10).join(' | ')}`);
ok(`BDD_cout : prix + unités identiques (${bddMatched}/${excelPriced})`, bddPriceMismatch === 0, `${bddPriceMismatch} écarts`);
ok(`BDD_cout : effectif seed (${bddCoutsData.length}) = articles Excel avec prix (${excelPriced})`, bddCoutsData.length === excelPriced);

// ─── 7. Etiquette : seuils DPE par type ───
// Seuils attendus (code) vérifiés par le comportement de calculEtiquetteEnergetique
const DPE_EXPECTED: Record<string, number[]> = {
  LOGEMENTS: [50, 90, 150, 230, 330, 450],
  BUREAUX: [50, 110, 210, 350, 540, 750],
  OCCUPATION_CONTINUE: [100, 210, 370, 580, 830, 1130],
  AUTRES: [30, 90, 170, 270, 380, 510],
};
for (const [type, seuils] of Object.entries(DPE_EXPECTED)) {
  const grades = ['A', 'B', 'C', 'D', 'E', 'F'];
  let allOk = true;
  for (let i = 0; i < 6; i++) {
    if (calculEtiquetteEnergetique(seuils[i], type) !== grades[i]) allOk = false;
    if (calculEtiquetteEnergetique(seuils[i] + 0.01, type) === grades[i]) allOk = false;
  }
  ok(`Seuils DPE ${type} = [${seuils.join(', ')}] (bornes exactes)`, allOk);
}
// Les seuils par type sont codés en dur dans les formules de pondération K26..U26 :
//   K26 = E25*50 + E26*50 + E27*100 + E28*30   (borne A)
//   ...
//   U26 = E25*450 + E26*750 + E27*1130 + E28*510 (borne F)
// où E25..E28 = parts de conso Logements / Bureaux / Occupation continue / Autres.
const etiq = wb.Sheets['Etiquette'];
const borneCells = ['K26', 'M26', 'O26', 'Q26', 'S26', 'U26'];
const typesOrder = ['LOGEMENTS', 'BUREAUX', 'OCCUPATION_CONTINUE', 'AUTRES'];
for (let i = 0; i < 6; i++) {
  const f = etiq[borneCells[i]]?.f as string | undefined;
  const m = f?.match(/E25\*(\d+)\+E26\*(\d+)\+E27\*(\d+)\+E28\*(\d+)/);
  if (!m) { ok(`Etiquette ${borneCells[i]} : formule de pondération lisible`, false, `f=${f}`); continue; }
  const coefs = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  let match = true;
  for (let t = 0; t < 4; t++) {
    if (DPE_EXPECTED[typesOrder[t]][i] !== coefs[t]) match = false;
  }
  ok(`Seuils DPE borne ${['A', 'B', 'C', 'D', 'E', 'F'][i]} (${borneCells[i]}) : Excel [${coefs.join(', ')}] = code`, match,
    `code=[${typesOrder.map(t => DPE_EXPECTED[t][i]).join(', ')}]`);
}
// Pondération par part de consommation kWhep (E = D/D29, D = SUMIF sur Donnees R) :
// même logique que calculEtiquetteGlobaleProjet (pondération par consoKwhep).
ok(`Etiquette : pondération par part de conso kWhep (E25=D25/D29, D=SUMIF Donnees!R)`,
  (etiq['E25']?.f || '').includes('D25/D29') && (etiq['D25']?.f || '').includes('Donnees!$R$4'));

// Vérification numérique de l'exemple réel du classeur : seuils pondérés K26..U26
const partsExcel = [Number(etiq['E25']?.v ?? 0), Number(etiq['E26']?.v ?? 0), Number(etiq['E27']?.v ?? 0), Number(etiq['E28']?.v ?? 0)];
for (let i = 0; i < 6; i++) {
  const attendu = Number(etiq[borneCells[i]]?.v ?? NaN);
  const calcule = typesOrder.reduce((s, t, ti) => s + partsExcel[ti] * DPE_EXPECTED[t][i], 0);
  ok(`Etiquette globale borne ${['A', 'B', 'C', 'D', 'E', 'F'][i]} : valeur Excel reproduite (${attendu.toFixed(2)})`,
    close(calcule, attendu, 0.01), `calculé=${calcule.toFixed(3)}`);
}

// ─── 9. Meteo_monotone : 8 760 h × 11 villes du seed = feuille Excel ───
const monoSheet = wb.Sheets['Meteo_monotone'];
const villesHeader: string[] = [];
for (let c = 2; c <= 12; c++) villesHeader.push(String(monoSheet[XLSX.utils.encode_cell({ r: 0, c })]?.v ?? ''));
const csvLines = fs.readFileSync(path.join(__dirname2, '..', 'prisma', 'data', 'meteo_monotone_toutes_villes.csv'), 'utf-8')
  .split('\n').filter(l => l.trim());
let monoChecked = 0, monoDiff = 0;
for (let vi = 0; vi < 11; vi++) {
  for (let h = 0; h < csvLines.length - 1; h++) {
    const excelV = monoSheet[XLSX.utils.encode_cell({ r: 1 + h, c: 2 + vi })]?.v;
    const csvV = parseFloat(csvLines[1 + h].split(',')[2 + vi]);
    if (excelV == null && Number.isNaN(csvV)) continue;
    monoChecked++;
    if (Math.abs(Number(excelV ?? NaN) - csvV) > 1e-9) monoDiff++;
  }
}
ok(`Meteo_monotone : ${monoChecked} températures horaires (11 villes × 8 760 h) identiques au CSV du seed`,
  monoChecked > 90000 && monoDiff === 0, `${monoDiff} divergences`);

console.log(`\n${fail === 0 ? '✓ DONNÉES DE RÉFÉRENCE CONFORMES À L\'EXCEL' : '✗ ÉCARTS DÉTECTÉS'} — ${pass} OK / ${fail} écart(s)`);
if (failures.length) { console.log('\nDétail des écarts :'); failures.forEach(f => console.log('  • ' + f)); }
process.exit(fail === 0 ? 0 : 1);
