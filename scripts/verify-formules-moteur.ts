/**
 * Vérification numérique du moteur de calcul contre les valeurs RÉELLES du classeur Excel.
 * Complète tests/parity-excel.test.ts (feuille Donnees) avec :
 *   - Monotone : cas complet du classeur (8 736 h, 30 kW, générateur 25 kW)
 *   - Bilan actualisé 20 ans : récurrence Excel reproduite pas à pas
 *   - Annuités + chiffrage référence (frais annexes, TVA)
 * Usage : npx tsx scripts/verify-formules-moteur.ts
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { calculMonotoneComplet } from '../lib/calculs/monotone';
import { calculBilan20Ans } from '../lib/calculs/bilan';
import { calculAnnuiteRef, calculInvestissementHTRef, calculInvestissementTTCRef } from '../lib/calculs/parc';

const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
const wb = XLSX.readFile(path.join(__dirname2, '..', 'excel-source.xlsm'), { cellFormula: true, sheetStubs: true });

let pass = 0, fail = 0;
const failures: string[] = [];
function check(label: string, actual: number, expected: number, tolPct = 0.0001) {
  const ok = Math.abs(actual - expected) <= Math.abs(expected) * tolPct + 1e-9;
  if (ok) pass++;
  else { fail++; failures.push(label); console.log(`✗ ${label}: calculé=${actual} attendu(Excel)=${expected}`); }
}

// ─── 1. MONOTONE : reproduire le cas réel du classeur ───
// Monotone_1 : H3=déperditions W, H4=Tint, H6=Text base ; D5.. = T° horaires (LOOKUP ville)
const m1 = wb.Sheets['Monotone_1'];
const m2 = wb.Sheets['Monotone_2'];
const deperdW = Number(m1['H3']?.v);
const tint = Number(m1['H4']?.v);
const textBase = Number(m1['H6']?.v);
// Monotone_2 C4:C8739 = Monotone_1!E5:E8740 → 8 736 heures ; on lit les T° correspondantes D5:D8740
const temps: number[] = [];
for (let r = 5; r <= 8740; r++) {
  const v = m1[`D${r}`]?.v;
  temps.push(typeof v === 'number' ? v : 0);
}
const pGen_kW = Number(m2['AS3']?.v); // puissance générateur de base saisie dans le classeur
const res = calculMonotoneComplet(temps, deperdW, tint, textBase, pGen_kW);

check('Monotone : puissance max appelée (Monotone_2!AS2)', res.puissanceMax, Number(m2['AS2']?.v));
check('Monotone : besoins totaux kWh (Monotone_2!AV3)', res.besoinsTotaux, Number(m2['AV3']?.v));
check('Monotone : besoins générateur base kWh (Monotone_2!AW3)', res.besoinsGenerateurBase, Number(m2['AW3']?.v));
check('Monotone : part base puissance (Monotone_2!BA2)', res.partBasePuissance / 100, Number(m2['BA2']?.v));
check('Monotone : part base énergie = % couverture bois (Monotone_2!BA3)', res.partBaseEnergie / 100, Number(m2['BA3']?.v));

// ─── 2. BILAN ACTUALISÉ 20 ANS : récurrence Excel reproduite indépendamment ───
// Formules du classeur (lignes 10-12) : année 1 = coût global ; année n = année n-1 × (1+taux) ;
// année 16 (durée+1) : − annuité (S11/S12) ; économies = réf − bio (ligne 13).
function bilanExcel(depart: number, taux: number, annuite: number, duree: number): number[] {
  const out: number[] = [depart];
  for (let y = 2; y <= 20; y++) {
    let v = out[y - 2] * (1 + taux);
    if (y === duree + 1) v -= annuite;
    out.push(v);
  }
  return out;
}
const coutActuel = 12000, coutRefGlobal = 11500, coutBioGlobal = 9200;
const annuiteRefT = 2607.9306666666666, annuiteBioT = 1800, tauxF = 0.04, tauxB = 0.02, duree = 15;
const excelActuel = bilanExcel(coutActuel, tauxF, 0, 99);
const excelRef = bilanExcel(coutRefGlobal, tauxF, annuiteRefT, duree);
const excelBio = bilanExcel(coutBioGlobal, tauxB, annuiteBioT, duree);
const bilanSaaS = calculBilan20Ans(coutActuel, coutRefGlobal, coutBioGlobal, tauxF, tauxB, annuiteRefT, annuiteBioT, duree);
let bilanOk = true;
for (let y = 0; y < 20; y++) {
  if (Math.abs(bilanSaaS[y].coutActuel - excelActuel[y]) > 0.01) bilanOk = false;
  if (Math.abs(bilanSaaS[y].coutRef - excelRef[y]) > 0.01) bilanOk = false;
  if (Math.abs(bilanSaaS[y].coutBiomasse - excelBio[y]) > 0.01) bilanOk = false;
  if (Math.abs(bilanSaaS[y].economie - (excelRef[y] - excelBio[y])) > 0.01) bilanOk = false;
}
check('Bilan 20 ans : 20 années × 3 scénarios + économies = récurrence Excel exacte', bilanOk ? 1 : 0, 1, 0);
check('Bilan 20 ans : annuité retranchée une seule fois à l\'année 16',
  bilanSaaS[15].coutRef, excelRef[14] * 1.04 - annuiteRefT);

// ─── 3. ANNUITÉ + CHIFFRAGE RÉFÉRENCE : valeurs réelles du classeur ───
const sb = wb.Sheets['solution biomasse'];
const cr = wb.Sheets['chiffrage_ref_Parc1'];
// L16 = (L5 + L14)/15 avec L5=investissement (30 000), L14=emprunt (9 118,96)
check('Annuité référence (solution biomasse!L16)',
  calculAnnuiteRef(Number(sb['L5']?.v), Number(sb['L14']?.v), 15), Number(sb['L16']?.v));
// Chiffrage ref Parc1 : lignes 19-21 (qté × PU), frais annexes D28..D31, F35/F36/F37
const lignes = [19, 20, 21].map(r => ({ qte: Number(cr[`D${r}`]?.v ?? 0), pu: Number(cr[`E${r}`]?.v ?? 0) }));
const frais = {
  bureauControle: Number(cr['D28']?.v ?? 0), maitriseOeuvre: Number(cr['D29']?.v ?? 0),
  fraisDivers: Number(cr['D30']?.v ?? 0), aleas: Number(cr['D31']?.v ?? 0),
};
const sousTotal = lignes.reduce((s, l) => s + l.qte * l.pu, 0);
check('Chiffrage réf : sous-total chaufferie (F23)', sousTotal, Number(cr['F23']?.v));
check('Chiffrage réf : total frais annexes (F33)',
  sousTotal * (frais.bureauControle + frais.maitriseOeuvre + frais.fraisDivers + frais.aleas), Number(cr['F33']?.v));
const investHT = calculInvestissementHTRef(lignes, frais);
// F35 Excel = F19+F33 (bug documenté §3.1) ; ici une seule ligne non nulle → F19 = sous-total,
// le total Excel coïncide donc avec le calcul correct — comparaison valide sur ce classeur.
check('Chiffrage réf : investissement HT (F35, classeur exemple)', investHT, Number(cr['F35']?.v));
check('Chiffrage réf : TVA 20 % (F36)', investHT * 0.20, Number(cr['F36']?.v));
check('Chiffrage réf : total TTC (F37)', calculInvestissementTTCRef(investHT), Number(cr['F37']?.v));

// ─── 4. Plafond subventions 80 % : structure de la formule M29 ───
const m29f = String(sb['M29']?.f || '');
check('Subventions : plafond 80 % présent dans M29 (IF(...>0.8, 0.8×M27, ...))',
  /IF\(\(M33\+M31\+M32\)\/M27>0\.8,0\.8\*M27/.test(m29f) ? 1 : 0, 1, 0);
// Annuité bio avec subventions : M38 = M37/15 + M35/15, M35 = M27 − M29 (invest net)
check('Annuité bio : M38 = (emprunt + invest net)/durée (structure)',
  String(sb['M38']?.f || '') === 'M37/15+M35/15' ? 1 : 0, 1, 0);

// ─── 5. Défauts globaux du modèle ───
check('P2 actuel (D14) = 750 €', Number(sb['D14']?.v), 750);
check('P2 référence (E14) = 750 €', Number(sb['E14']?.v), 750);
check('P2 biomasse (F14) = 1200 €', Number(sb['F14']?.v), 1200);
check('Taux emprunt (I14) = 2 %', Number(sb['I14']?.v), 0.02);
check('Tarif exploitation fuel (F26)', Number(sb['F26']?.v), 0.10);
check('Tarif exploitation gaz (F27)', Number(sb['F27']?.v), 0.1502);
check('Tarif exploitation bois (F28 = 0,0443×1,2)', Number(sb['F28']?.v), 0.05316);
check('Tarif exploitation élec (F30)', Number(sb['F30']?.v), 0.1788);

console.log(`\n${fail === 0 ? '✓ FORMULES MOTEUR CONFORMES AU CLASSEUR' : '✗ ÉCARTS DÉTECTÉS'} — ${pass} OK / ${fail} écart(s)`);
if (failures.length) failures.forEach(f => console.log('  • ' + f));
process.exit(fail === 0 ? 0 : 1);
