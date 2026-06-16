/* Vérification des cas limites du moteur de calcul (pur, sans DB). */
import {
  calculsBatimentComplet, calculEtiquetteEnergetique, calculRendementMoyen,
  calculConsoRefCalculees, calculConsoKWhep,
} from '../lib/calculs/batiment';
import { calculBilan20Ans, calculCO2Emissions, getEmissionFactor } from '../lib/calculs/bilan';
import {
  calculConsommationsEntreeChaudiereBois, calculConsommationsAppoint, calculHeuresPP,
  calculAnnuiteRef, calculConsoSortieParcChaudieresRef,
} from '../lib/calculs/parc';
import { calculMonotoneComplet } from '../lib/calculs/monotone';
import { calculFraisAnnexes, calculAnnuite } from '../lib/calculs/chiffrage';

let pass = 0, fail = 0;
const finite = (v: any) => typeof v === 'number' && Number.isFinite(v);
function check(name: string, fn: () => any, validate: (r: any) => boolean) {
  try {
    const r = fn();
    const ok = validate(r);
    console.log(`${ok ? '✓' : '✗ ÉCHEC'} ${name}${ok ? '' : ' → ' + JSON.stringify(r)}`);
    ok ? pass++ : fail++;
  } catch (e: any) {
    console.log(`✗ EXCEPTION ${name} → ${e.message}`);
    fail++;
  }
}
const bat = (init: any, ref: any = null) => ({
  numero: 1, designation: 'x', typeBatiment: 'AUTRES', surfaceChauffee: 100, volumeChauffe: 300, parc: 1,
  etatInitial: { deperditions_kW: 20, rendementProduction: 80, rendementDistribution: 90, rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1, consommationsCalculees: 50000, consommationsReelles: 50000, typeEnergie: 'Fuel', tarification: 0.13, abonnement: 0, ...init },
  etatReference: ref,
});
const allCalcsFinite = (c: any) => Object.values(c).every(v => typeof v !== 'number' || Number.isFinite(v));

console.log('═══ Cas limites — moteur de calcul ═══\n');

// 1. Bâtiment tout électrique
check('Bâtiment électrique (kWhep ×2.3)', () => calculsBatimentComplet(bat({ typeEnergie: 'Electricité' }), 2000, 19, -7), allCalcsFinite);

// 2. ΔT = 0 (Tint = Text)
check('ΔT = 0 (Tint=Text) → pas de division', () => calculsBatimentComplet(bat({}, bat({}).etatInitial), 2000, 19, 19), allCalcsFinite);

// 3. Rendements = 0
check('Rendement initial = 0', () => calculsBatimentComplet(bat({ rendementProduction: 0, rendementDistribution: 0 }), 2000, 19, -7), allCalcsFinite);

// 4. DJU = 0
check('DJU = 0', () => calculsBatimentComplet(bat({}, bat({}).etatInitial), 0, 19, -7), allCalcsFinite);

// 5. Conso énorme et minuscule
check('Conso énorme (1e9)', () => calculsBatimentComplet(bat({ consommationsCalculees: 1e9, consommationsReelles: 1e9 }), 2000, 19, -7), allCalcsFinite);
check('Conso nulle (0)', () => calculsBatimentComplet(bat({ consommationsCalculees: 0, consommationsReelles: 0 }), 2000, 19, -7), allCalcsFinite);

// 6. Bâtiment SANS état de référence
check('Pas d\'état de référence (null)', () => calculsBatimentComplet(bat({}, null), 2000, 19, -7), allCalcsFinite);

// 7. Étiquette DPE : 0, NaN, Infinity, énorme
check('DPE(0) = —', () => calculEtiquetteEnergetique(0, 'AUTRES'), (r) => r === '—');
check('DPE(NaN) = —', () => calculEtiquetteEnergetique(NaN, 'AUTRES'), (r) => r === '—');
check('DPE(Infinity) = lettre', () => calculEtiquetteEnergetique(Infinity, 'AUTRES'), (r) => typeof r === 'string' && r.length === 1);
check('DPE(99999) = G', () => calculEtiquetteEnergetique(99999, 'LOGEMENTS'), (r) => r === 'G');

// 8. Bilan 20 ans : durée 0, gains négatifs, augmentation énorme
check('Bilan durée emprunt = 0', () => calculBilan20Ans(30000, 35000, 33000, 0.04, 0.02, 2000, 2666, 0), (r: any[]) => r.length === 20 && r.every(y => finite(y.coutRef) && finite(y.coutBiomasse) && finite(y.economie)));
check('Bilan biomasse plus chère (gain négatif)', () => calculBilan20Ans(30000, 30000, 99000, 0.04, 0.02, 0, 5000, 15), (r: any[]) => r.length === 20 && r.every(y => finite(y.economie)));
check('Bilan augmentation 100%/an', () => calculBilan20Ans(30000, 35000, 33000, 1.0, 1.0, 2000, 2666, 15), (r: any[]) => r.every(y => finite(y.coutRef)));

// 9. Parc : rendement/puissance = 0
check('Entrée chaudière rendement 0 → 0', () => calculConsommationsEntreeChaudiereBois(1000, 0), (r) => r === 0);
check('Appoint rendement 0 → 0', () => calculConsommationsAppoint(1000, 80, 0), (r) => r === 0);
check('HeuresPP puissance 0 → 0', () => calculHeuresPP(1000, 0), (r) => r === 0);
check('Annuité durée 0 → fini', () => calculAnnuiteRef(50000, 0, 0), finite);
check('Annuité (chiffrage) durée 0 → fini', () => calculAnnuite(50000, 0, 0), finite);

// 10. Monotone : données vides (pas de -Infinity)
check('Monotone série vide → pas de -Infinity', () => calculMonotoneComplet([], 20, 19, -7), (r: any) => finite(r.puissanceMax) && finite(r.besoinsTotaux));

// 11. Frais annexes : tous taux 0, lignes vides
check('Frais annexes taux 0', () => calculFraisAnnexes(0, { bureauControle: 0, maitriseOeuvre: 0, fraisDivers: 0, aleas: 0 } as any), finite);

// 12. CO2 : combustible inconnu
check('CO2 combustible inconnu → fini', () => calculCO2Emissions(50000, getEmissionFactor('Combustible inconnu XYZ' as any)), finite);

// 13. Conso sortie parc réf : ΔT=0
check('Conso sortie parc ΔT=0', () => calculConsoSortieParcChaudieresRef([bat({}, bat({}).etatInitial)] as any, 2000, 19, 19), finite);

console.log(`\n═══ ${pass} OK / ${fail} échec(s) ═══`);
process.exit(fail > 0 ? 1 : 0);
