/**
 * Vérification de parité avec les valeurs présentes dans l'Excel
 * faisabilite_biomasse_version_2.xlsm (feuille Donnees, lignes 5-6)
 */
import { calculsBatimentComplet } from '../lib/calculs/batiment';
import { calculConso10JoursFroids, calculVolumeCendres, calculPertesReseau } from '../lib/calculs/parc';
import type { Batiment } from '../lib/calculs/types';

let pass = 0, fail = 0;
function check(label: string, actual: number, expected: number, tolPct = 0.001) {
  const ok = Math.abs(actual - expected) <= Math.abs(expected) * tolPct + 1e-9;
  console.log(`${ok ? '✓' : '✗'} ${label}: ${actual.toFixed(2)} (Excel: ${expected})`);
  ok ? pass++ : fail++;
}

// Bâtiment 1 (Donnees ligne 6) : déperd. ref 10 kW, Gaz naturel, rendements ref 0.8/0.9/0.9/0.9
const bat1: Batiment = {
  numero: 1, designation: 'Bâtiment 1', typeBatiment: 'LOGEMENTS',
  surfaceChauffee: 100, volumeChauffe: 300, parc: 1,
  etatInitial: {
    deperditions_kW: 10, rendementProduction: 80, rendementDistribution: 90,
    rendementEmission: 90, rendementRegulation: 90, coefIntermittence: 1,
    consommationsCalculees: 31464, consommationsReelles: 32000,
    typeEnergie: 'Fuel', tarification: 0.13, abonnement: 0,
  },
  etatReference: {
    deperditions_kW: 10, rendementProduction: 0.8, rendementDistribution: 0.9,
    rendementEmission: 0.9, rendementRegulation: 0.9,
    consommationsCalculees: 0, typeEnergie: 'Gaz naturel', tarification: 0.978, abonnement: 0,
  },
};
const c1 = calculsBatimentComplet(bat1, 1977, 19, -7);
check('B1 conso ref calculées (AE6)', c1.consoRefCalculees!, 31291.5479582146);
check('B1 conso ref PCS (AF6)', c1.consoRefPCS!, 34420.702754036065);
check('B1 conso sortie chaudières (AH6)', c1.consoSortieChaudieresRef!, 25033.23836657168);
check('B1 conso kWhep (R6 = conso réelles)', c1.consoKWhepEI, 32000);
check('B1 coût annuel initial (X6)', c1.coutAnnuelEI, 4090.32);

// Bâtiment 2 (Donnees ligne 5) : déperd. ref 20 kW, élec à l'initial (×2.3)
const bat2: Batiment = {
  ...bat1, numero: 2,
  etatInitial: { ...bat1.etatInitial, deperditions_kW: 20, rendementProduction: 85,
    rendementDistribution: 90, consommationsCalculees: 58868, consommationsReelles: 60000,
    typeEnergie: 'Electricité', tarification: 0.226 },
  etatReference: { ...bat1.etatReference!, deperditions_kW: 20, rendementProduction: 0.85 },
};
const c2 = calculsBatimentComplet(bat2, 1977, 19, -7);
check('B2 conso ref calculées (AE5)', c2.consoRefCalculees!, 58901.7373331099);
check('B2 conso ref PCS (AF5)', c2.consoRefPCS!, 64791.91106642089);
check('B2 conso sortie chaudières (AH5)', c2.consoSortieChaudieresRef!, 50066.47673314341);
check('B2 conso kWhep élec ×2.3 (R5)', c2.consoKWhepEI, 138000);
check('B2 coût annuel initial (X5)', c2.coutAnnuelEI, 13304.168);

// Pertes réseau : Excel = 3450 × kW/ml × ml (table Utile, DN50 = 0.012 kW/ml)
check('Pertes réseau 500 ml DN50', calculPertesReseau(500, 0.012), 20700);

// Conso 10 jours = 11 % (VBA TextBox24 = TextBox14 × 0.11)
check('Conso 10 jours froids (11 %)', calculConso10JoursFroids(100000), 11000);

// Cendres plaquette 100 MWh : 26.316 t × 0.75 × 1000 × 0.01 / 600 = 0.3289 m³
const cend = calculVolumeCendres(100000, 3.8, 0.25, 0.01);
check('Cendres kg (masse sèche × taux)', cend.kg, 197.37, 0.001);
check('Cendres m³ (kg/600)', cend.m3, 0.32895, 0.001);

console.log(`\n${fail === 0 ? '✓ PARITÉ EXCEL CONFIRMÉE' : '✗ ÉCHECS'} — ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
