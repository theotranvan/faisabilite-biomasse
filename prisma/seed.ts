import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const energiesData = [
  { nom: 'Bois déchiquetté', abonnement: 0, tarification: 0.053 },
  { nom: 'Bois granulés', abonnement: 0, tarification: 0.1162 },
  { nom: 'Bois soufflerie', abonnement: 0, tarification: 0.053 },
  { nom: 'Électricité', abonnement: 0, tarification: 0.226 },
  { nom: 'Fuel', abonnement: 0, tarification: 0.13 },
  { nom: 'Gaz naturel', abonnement: 0, tarification: 0.978 },
  { nom: 'Gaz propane', abonnement: 0, tarification: 0.1652 },
];

const caracteristiquesData = [
  { type: 'PLAQUETTE', pci: 3.8, masseVolumique: 225, tauxHumidite: 25, tauxCendre: 1 },
  { type: 'GRANULES', pci: 4.6, masseVolumique: 650, tauxHumidite: 7, tauxCendre: 0.5 },
  { type: 'MISCANTHUS', pci: 4.2, masseVolumique: 120, tauxHumidite: 10, tauxCendre: 3 },
  { type: 'BUCHES', pci: 4.0, masseVolumique: 420, tauxHumidite: 20, tauxCendre: 1 },
];

const facteursEmissionData = [
  { combustible: 'Plaquette', co2PerKwh: 0.013, so2PerKwh: 0.00025 },
  { combustible: 'Granulé', co2PerKwh: 0.027, so2PerKwh: 0.00024 },
  { combustible: 'Fuel', co2PerKwh: 0.314, so2PerKwh: 0.00074 },
  { combustible: 'Gaz naturel', co2PerKwh: 0.243, so2PerKwh: 0.00070 },
  { combustible: 'Gaz propane', co2PerKwh: 0.270, so2PerKwh: 0.00150 },
  { combustible: 'Electricité', co2PerKwh: 0.210, so2PerKwh: 0.00086 },
];

const bddCoutsData = [
  // ISOLATION (Excel BDD_cout colonnes B-D)
  { categorie: 'ISOLATION', designation: 'Isolation de plancher', unite: 'm²', prixUnitaire: 80 },
  { categorie: 'ISOLATION', designation: 'Isolation de rampant', unite: 'm²', prixUnitaire: 120 },
  { categorie: 'ISOLATION', designation: 'Isolation des combles perdus', unite: 'm²', prixUnitaire: 80 },
  { categorie: 'ISOLATION', designation: 'Isolation des murs par l\'extérieur', unite: 'm²', prixUnitaire: 315 },
  { categorie: 'ISOLATION', designation: 'Isolation des murs par l\'intérieur', unite: 'm²', prixUnitaire: 80 },
  { categorie: 'ISOLATION', designation: 'Remplacement des menuiseries', unite: 'm²', prixUnitaire: 800 },
  // EQUIPEMENTS (Excel BDD_cout colonnes F-H)
  { categorie: 'EQUIPEMENTS', designation: 'GTC', unite: 'Ens', prixUnitaire: 5000 },
  { categorie: 'EQUIPEMENTS', designation: 'Compteurs énergie', unite: 'U', prixUnitaire: 1300 },
  { categorie: 'EQUIPEMENTS', designation: 'Ballon tampon 750l', unite: 'U', prixUnitaire: 2500 },
  { categorie: 'EQUIPEMENTS', designation: 'Désemboueur', unite: 'U', prixUnitaire: 2000 },
  { categorie: 'EQUIPEMENTS', designation: 'Vase expansion', unite: 'U', prixUnitaire: 400 },
  { categorie: 'EQUIPEMENTS', designation: 'Tube acier DN50', unite: 'ml', prixUnitaire: 57 },
  { categorie: 'EQUIPEMENTS', designation: 'Calorifugeage', unite: 'ml', prixUnitaire: 15 },
  { categorie: 'EQUIPEMENTS', designation: 'Pompe double', unite: 'U', prixUnitaire: 3000 },
  { categorie: 'EQUIPEMENTS', designation: 'Bouteille de mélange', unite: 'U', prixUnitaire: 500 },
  { categorie: 'EQUIPEMENTS', designation: 'Ensemble d\'équipements', unite: 'Ens', prixUnitaire: 1000 },
  { categorie: 'EQUIPEMENTS', designation: 'Sol béton', unite: 'm²', prixUnitaire: 50 },
  { categorie: 'EQUIPEMENTS', designation: 'Mur parpaing', unite: 'm²', prixUnitaire: 150 },
  { categorie: 'EQUIPEMENTS', designation: 'Enduit extérieur silo', unite: 'm²', prixUnitaire: 60 },
  { categorie: 'EQUIPEMENTS', designation: 'Pente dessileur', unite: 'm²', prixUnitaire: 500 },
  { categorie: 'EQUIPEMENTS', designation: 'Toiture', unite: 'm²', prixUnitaire: 100 },
  { categorie: 'EQUIPEMENTS', designation: 'Bardage bois intérieur', unite: 'm²', prixUnitaire: 50 },
  // VRD (Excel BDD_cout colonnes J-L)
  { categorie: 'VRD', designation: 'Aménagement extérieur (gravillons)', unite: 'm²', prixUnitaire: 16 },
  { categorie: 'VRD', designation: 'Création branchement', unite: 'U', prixUnitaire: 1800 },
  { categorie: 'VRD', designation: 'Tranchées', unite: 'ml', prixUnitaire: 95 },
  { categorie: 'VRD', designation: 'Réseau AEP', unite: 'ml', prixUnitaire: 25 },
  { categorie: 'VRD', designation: 'Bordure', unite: 'ml', prixUnitaire: 40 },
  { categorie: 'VRD', designation: 'Empierrement + Gravillons', unite: 'm²', prixUnitaire: 50 },
  { categorie: 'VRD', designation: 'Neutralisation cuve', unite: 'U', prixUnitaire: 900 },
  { categorie: 'VRD', designation: 'Clôture', unite: 'ml', prixUnitaire: 60 },
  { categorie: 'VRD', designation: 'Portail', unite: 'U', prixUnitaire: 2000 },
  { categorie: 'VRD', designation: 'Béton balayé', unite: 'm²', prixUnitaire: 50 },
  { categorie: 'VRD', designation: 'Décapage terre végétale', unite: 'm³', prixUnitaire: 70 },
  { categorie: 'VRD', designation: 'Dépose cuve', unite: 'U', prixUnitaire: 2000 },
  // GROS_OEUVRE (Excel BDD_cout colonnes N-P)
  { categorie: 'GROS_OEUVRE', designation: 'Fondations', unite: 'ml', prixUnitaire: 65 },
  { categorie: 'GROS_OEUVRE', designation: 'Parpaings', unite: 'm²', prixUnitaire: 140 },
  { categorie: 'GROS_OEUVRE', designation: 'Dallage', unite: 'm²', prixUnitaire: 95 },
  { categorie: 'GROS_OEUVRE', designation: 'Enduit', unite: 'm²', prixUnitaire: 50 },
  { categorie: 'GROS_OEUVRE', designation: 'Seuils', unite: 'ml', prixUnitaire: 55 },
  { categorie: 'GROS_OEUVRE', designation: 'OSB silo', unite: 'Ens', prixUnitaire: 800 },
  { categorie: 'GROS_OEUVRE', designation: 'Porte CF Chaufferie', unite: 'U', prixUnitaire: 4800 },
  { categorie: 'GROS_OEUVRE', designation: 'Porte CF Silo', unite: 'U', prixUnitaire: 3000 },
  { categorie: 'GROS_OEUVRE', designation: 'Plafond CF', unite: 'm²', prixUnitaire: 240 },
  { categorie: 'GROS_OEUVRE', designation: 'Charpente', unite: 'm²', prixUnitaire: 110 },
  { categorie: 'GROS_OEUVRE', designation: 'Couverture', unite: 'm²', prixUnitaire: 84 },
  { categorie: 'GROS_OEUVRE', designation: 'Bac Acier façade', unite: 'm²', prixUnitaire: 140 },
  { categorie: 'GROS_OEUVRE', designation: 'Installation chantier', unite: 'Ens', prixUnitaire: 3000 },
  { categorie: 'GROS_OEUVRE', designation: 'Membrane couverture', unite: 'm²', prixUnitaire: 140 },
  // CHAUFFERIE_BIOMASSE (Excel BDD_cout colonnes R-T)
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Réseau Gaz', unite: 'Ens', prixUnitaire: 800 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 50 kW', unite: 'U', prixUnitaire: 9000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 80 kW', unite: 'U', prixUnitaire: 11200 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 100 kW', unite: 'U', prixUnitaire: 13000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 150 kW', unite: 'U', prixUnitaire: 19000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 200 kW', unite: 'U', prixUnitaire: 22000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 300 kW', unite: 'U', prixUnitaire: 35000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Gaz 500 kW', unite: 'U', prixUnitaire: 40000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 50 kW', unite: 'U', prixUnitaire: 25000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 80 kW', unite: 'U', prixUnitaire: 30500 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 100 kW', unite: 'U', prixUnitaire: 36400 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 150 kW', unite: 'U', prixUnitaire: 52650 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 200 kW', unite: 'U', prixUnitaire: 63000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 300 kW', unite: 'U', prixUnitaire: 75000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'VB-VH', unite: 'Ens', prixUnitaire: 700 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Vase expansion', unite: 'U', prixUnitaire: 700 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Fumisterie', unite: 'Ens', prixUnitaire: 4000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Collecteur', unite: 'Ens', prixUnitaire: 6000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Calorifuge', unite: 'Ens', prixUnitaire: 3000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Ballon tampon', unite: 'Ens', prixUnitaire: 3000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Pot à boue', unite: 'U', prixUnitaire: 2000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Remplissage eau', unite: 'Ens', prixUnitaire: 2000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Pompe double', unite: 'U', prixUnitaire: 4000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Trémie de transfert', unite: 'U', prixUnitaire: 18000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'GTC', unite: 'Ens', prixUnitaire: 9000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Réseau de chaleur', unite: 'ml', prixUnitaire: 80 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Tranchées + réseau chaleur', unite: 'ml', prixUnitaire: 174 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Sous station', unite: 'U', prixUnitaire: 3000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Elec chaufferie', unite: 'Ens', prixUnitaire: 7000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Compteur énergie', unite: 'U', prixUnitaire: 900 },
  // CHAUFFAGE_BATIMENTS (Excel BDD_cout colonnes V-X)
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Radiateur', unite: 'U', prixUnitaire: 350 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Réseau de chauffage', unite: 'Ens', prixUnitaire: 3500 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Ballon échangeur', unite: 'U', prixUnitaire: 1800 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Groupe mélange + régul', unite: 'U', prixUnitaire: 2000 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Placard d\'habillage', unite: 'U', prixUnitaire: 1500 },
];

const pertesReseauData = [
  { section: 'DN25', pertesKwPerMl: 0.007 },
  { section: 'DN32', pertesKwPerMl: 0.009 },
  { section: 'DN40', pertesKwPerMl: 0.010 },
  { section: 'DN50', pertesKwPerMl: 0.012 },
];

// DJU moyens 1996-2022 et températures extérieures de base — feuille Excel "Meteo" (source SDES / Météo France)
const meteoMoyenneData = [
  { departement: 'Ain', code: '01', djuMoyenne: 2148.1, tempExtBase: -10 },
  { departement: 'Aisne', code: '02', djuMoyenne: 2266.5, tempExtBase: -7 },
  { departement: 'Allier', code: '03', djuMoyenne: 2127.9, tempExtBase: -8 },
  { departement: 'Alpes-de-Haute-Provence', code: '04', djuMoyenne: 1833.2, tempExtBase: -8 },
  { departement: 'Hautes-Alpes', code: '05', djuMoyenne: 2342.9, tempExtBase: -10 },
  { departement: 'Alpes-Maritimes', code: '06', djuMoyenne: 1017.4, tempExtBase: -2 },
  { departement: 'Ardèche', code: '07', djuMoyenne: 1738.1, tempExtBase: -7 },
  { departement: 'Ardennes', code: '08', djuMoyenne: 2472.2, tempExtBase: -10 },
  { departement: 'Ariège', code: '09', djuMoyenne: 1843.1, tempExtBase: -5 },
  { departement: 'Aube', code: '10', djuMoyenne: 2204.4, tempExtBase: -10 },
  { departement: 'Aude', code: '11', djuMoyenne: 1497.2, tempExtBase: -5 },
  { departement: 'Aveyron', code: '12', djuMoyenne: 2244.0, tempExtBase: -8 },
  { departement: 'Bouches-du-Rhône', code: '13', djuMoyenne: 1261.3, tempExtBase: -5 },
  { departement: 'Calvados', code: '14', djuMoyenne: 1999.8, tempExtBase: -7 },
  { departement: 'Cantal', code: '15', djuMoyenne: 2347.9, tempExtBase: -8 },
  { departement: 'Charente', code: '16', djuMoyenne: 1610.8, tempExtBase: -5 },
  { departement: 'Charente-Maritime', code: '17', djuMoyenne: 1592.5, tempExtBase: -5 },
  { departement: 'Cher', code: '18', djuMoyenne: 2004.1, tempExtBase: -7 },
  { departement: 'Corrèze', code: '19', djuMoyenne: 1797.6, tempExtBase: -8 },
  { departement: 'Corse-du-Sud', code: '2A', djuMoyenne: 1078.8, tempExtBase: -2 },
  { departement: 'Haute-Corse', code: '2B', djuMoyenne: 1046.4, tempExtBase: -2 },
  { departement: 'Côte-d\'Or', code: '21', djuMoyenne: 2262.9, tempExtBase: -10 },
  { departement: 'Côtes-d\'Armor', code: '22', djuMoyenne: 1918.4, tempExtBase: -4 },
  { departement: 'Creuse', code: '23', djuMoyenne: 2277.6, tempExtBase: -8 },
  { departement: 'Dordogne', code: '24', djuMoyenne: 1724.5, tempExtBase: -5 },
  { departement: 'Doubs', code: '25', djuMoyenne: 2228.6, tempExtBase: -12 },
  { departement: 'Drôme', code: '26', djuMoyenne: 1633.7, tempExtBase: -7 },
  { departement: 'Eure', code: '27', djuMoyenne: 2161.1, tempExtBase: -7 },
  { departement: 'Eure-et-Loir', code: '28', djuMoyenne: 2122.4, tempExtBase: -7 },
  { departement: 'Finistère', code: '29', djuMoyenne: 1801.4, tempExtBase: -4 },
  { departement: 'Gard', code: '30', djuMoyenne: 1339.9, tempExtBase: -5 },
  { departement: 'Haute-Garonne', code: '31', djuMoyenne: 1568.9, tempExtBase: -5 },
  { departement: 'Gers', code: '32', djuMoyenne: 1688.2, tempExtBase: -5 },
  { departement: 'Gironde', code: '33', djuMoyenne: 1481.5, tempExtBase: -5 },
  { departement: 'Hérault', code: '34', djuMoyenne: 1296.1, tempExtBase: -5 },
  { departement: 'Ille-et-Vilaine', code: '35', djuMoyenne: 1818.7, tempExtBase: -5 },
  { departement: 'Indre', code: '36', djuMoyenne: 2012.3, tempExtBase: -7 },
  { departement: 'Indre-et-Loire', code: '37', djuMoyenne: 1938.5, tempExtBase: -7 },
  { departement: 'Isère', code: '38', djuMoyenne: 2262.6, tempExtBase: -10 },
  { departement: 'Jura', code: '39', djuMoyenne: 2130.4, tempExtBase: -10 },
  { departement: 'Landes', code: '40', djuMoyenne: 1588.3, tempExtBase: -5 },
  { departement: 'Loir-et-Cher', code: '41', djuMoyenne: 2091.5, tempExtBase: -7 },
  { departement: 'Loire', code: '42', djuMoyenne: 2126.5, tempExtBase: -10 },
  { departement: 'Haute-Loire', code: '43', djuMoyenne: 2729.4, tempExtBase: -8 },
  { departement: 'Loire-Atlantique', code: '44', djuMoyenne: 1754.7, tempExtBase: -5 },
  { departement: 'Loiret', code: '45', djuMoyenne: 2097.9, tempExtBase: -7 },
  { departement: 'Lot', code: '46', djuMoyenne: 1786.4, tempExtBase: -7 },
  { departement: 'Lot-et-Garonne', code: '47', djuMoyenne: 1621.7, tempExtBase: -5 },
  { departement: 'Lozère', code: '48', djuMoyenne: 2619.7, tempExtBase: -8 },
  { departement: 'Maine-et-Loire', code: '49', djuMoyenne: 1812.7, tempExtBase: -7 },
  { departement: 'Manche', code: '50', djuMoyenne: 1949.4, tempExtBase: -4 },
  { departement: 'Marne', code: '51', djuMoyenne: 2257.4, tempExtBase: -10 },
  { departement: 'Haute-Marne', code: '52', djuMoyenne: 2513.5, tempExtBase: -12 },
  { departement: 'Mayenne', code: '53', djuMoyenne: 2014.9, tempExtBase: -7 },
  { departement: 'Meurthe-et-Moselle', code: '54', djuMoyenne: 2335.1, tempExtBase: -15 },
  { departement: 'Meuse', code: '55', djuMoyenne: 2415.3, tempExtBase: -12 },
  { departement: 'Morbihan', code: '56', djuMoyenne: 1759.8, tempExtBase: -4 },
  { departement: 'Moselle', code: '57', djuMoyenne: 2314.7, tempExtBase: -15 },
  { departement: 'Nièvre', code: '58', djuMoyenne: 2162.4, tempExtBase: -10 },
  { departement: 'Nord', code: '59', djuMoyenne: 2144.3, tempExtBase: -9 },
  { departement: 'Oise', code: '60', djuMoyenne: 2223.5, tempExtBase: -7 },
  { departement: 'Orne', code: '61', djuMoyenne: 2107.7, tempExtBase: -7 },
  { departement: 'Pas-de-Calais', code: '62', djuMoyenne: 2066.4, tempExtBase: -9 },
  { departement: 'Puy-de-Dôme', code: '63', djuMoyenne: 2017.9, tempExtBase: -8 },
  { departement: 'Pyrénées-Atlantiques', code: '64', djuMoyenne: 1553.3, tempExtBase: -5 },
  { departement: 'Hautes-Pyrénées', code: '65', djuMoyenne: 1783.7, tempExtBase: -5 },
  { departement: 'Pyrénées-Orientales', code: '66', djuMoyenne: 1144.3, tempExtBase: -5 },
  { departement: 'Bas-Rhin', code: '67', djuMoyenne: 2257.9, tempExtBase: -15 },
  { departement: 'Haut-Rhin', code: '68', djuMoyenne: 2334.4, tempExtBase: -15 },
  { departement: 'Rhône', code: '69', djuMoyenne: 1901.3, tempExtBase: -10 },
  { departement: 'Haute-Saône', code: '70', djuMoyenne: 2389.1, tempExtBase: -12 },
  { departement: 'Saône-et-Loire', code: '71', djuMoyenne: 2056.7, tempExtBase: -10 },
  { departement: 'Sarthe', code: '72', djuMoyenne: 1881.7, tempExtBase: -7 },
  { departement: 'Savoie', code: '73', djuMoyenne: 2472.9, tempExtBase: -10 },
  { departement: 'Haute-Savoie', code: '74', djuMoyenne: 2346.5, tempExtBase: -10 },
  { departement: 'Paris', code: '75', djuMoyenne: 1824.4, tempExtBase: -7 },
  { departement: 'Seine-Maritime', code: '76', djuMoyenne: 2180.3, tempExtBase: -7 },
  { departement: 'Seine-et-Marne', code: '77', djuMoyenne: 2092.2, tempExtBase: -7 },
  { departement: 'Yvelines', code: '78', djuMoyenne: 2101.6, tempExtBase: -7 },
  { departement: 'Deux-Sèvres', code: '79', djuMoyenne: 1791.6, tempExtBase: -7 },
  { departement: 'Somme', code: '80', djuMoyenne: 2134.6, tempExtBase: -9 },
  { departement: 'Tarn', code: '81', djuMoyenne: 1692.3, tempExtBase: -5 },
  { departement: 'Tarn-et-Garonne', code: '82', djuMoyenne: 1641.6, tempExtBase: -5 },
  { departement: 'Var', code: '83', djuMoyenne: 1329.8, tempExtBase: -2 },
  { departement: 'Vaucluse', code: '84', djuMoyenne: 1551.9, tempExtBase: -7 },
  { departement: 'Vendée', code: '85', djuMoyenne: 1821.8, tempExtBase: -5 },
  { departement: 'Vienne', code: '86', djuMoyenne: 1946.5, tempExtBase: -7 },
  { departement: 'Haute-Vienne', code: '87', djuMoyenne: 2043.6, tempExtBase: -8 },
  { departement: 'Vosges', code: '88', djuMoyenne: 2473.6, tempExtBase: -15 },
  { departement: 'Yonne', code: '89', djuMoyenne: 2186.3, tempExtBase: -10 },
  { departement: 'Territoire de Belfort', code: '90', djuMoyenne: 2381.8, tempExtBase: -15 },
  { departement: 'Essonne', code: '91', djuMoyenne: 2000.0, tempExtBase: -7 },
  { departement: 'Hauts-de-Seine', code: '92', djuMoyenne: 1848.2, tempExtBase: -7 },
  { departement: 'Seine-Saint-Denis', code: '93', djuMoyenne: 1971.6, tempExtBase: -7 },
  { departement: 'Val-de-Marne', code: '94', djuMoyenne: 1848.2, tempExtBase: -7 },
  { departement: 'Val-d\'Oise', code: '95', djuMoyenne: 2005.1, tempExtBase: -7 },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.user.deleteMany({});
  await prisma.bddCout.deleteMany({});
  await prisma.pertesReseau.deleteMany({});
  await prisma.facteurEmission.deleteMany({});
  await prisma.caracteristiqueBiomasse.deleteMany({});
  await prisma.energie.deleteMany({});
  await prisma.meteoMoyenne.deleteMany({});
  await prisma.meteoMonotone.deleteMany({});

  // Seed Énergies
  for (const energie of energiesData) {
    await prisma.energie.create({ data: energie });
  }
  console.log('✓ Énergies seeded');

  // Seed Caractéristiques Biomasse
  for (const carac of caracteristiquesData) {
    await prisma.caracteristiqueBiomasse.create({ data: carac });
  }
  console.log('✓ Caractéristiques Biomasse seeded');

  // Seed Facteurs d'Émission
  for (const facteur of facteursEmissionData) {
    await prisma.facteurEmission.create({ data: facteur });
  }
  console.log('✓ Facteurs d\'Émission seeded');

  // Seed BDD Coûts
  for (const cout of bddCoutsData) {
    await prisma.bddCout.create({ data: cout });
  }
  console.log('✓ BDD Coûts seeded');

  // Seed Pertes Réseau
  for (const perte of pertesReseauData) {
    await prisma.pertesReseau.create({ data: perte });
  }
  console.log('✓ Pertes Réseau seeded');

  // Seed Météo Moyenne
  for (const meteo of meteoMoyenneData) {
    await prisma.meteoMoyenne.create({ data: meteo });
  }
  console.log('✓ Météo Moyenne seeded');

  // Seed MeteoMonotone (8760 hours × 11 cities)
  const monotoneCsvPath = path.join(__dirname, 'data', 'meteo_monotone_toutes_villes.csv');
  if (fs.existsSync(monotoneCsvPath)) {
    const monotoneCsv = fs.readFileSync(monotoneCsvPath, 'utf-8');
    const lines = monotoneCsv.split('\n').slice(1); // skip header
    const villes = ['Bourges','Chartres','Chateauroux','Gueret','Limoges','Nevers','Orleans','Paris','Poitiers','Tours','Vichy'];

    for (const ville of villes) {
      const villeIndex = villes.indexOf(ville) + 2; // columns C to M = index 2 to 12
      const records = lines
        .filter(l => l.trim())
        .map((line, heure) => {
          const cols = line.split(',');
          return {
            ville,
            heure,
            temperatureExt: parseFloat(cols[villeIndex]) || 0,
          };
        });

      await prisma.meteoMonotone.createMany({ data: records });
    }
    console.log('✓ MeteoMonotone seeded (8760 × 11 villes)');
  } else {
    console.log('⚠ MeteoMonotone CSV not found at prisma/data/meteo_monotone_toutes_villes.csv — skipping');
  }

  // Create Default User for mono-client app
  // First delete if exists
  await prisma.user.deleteMany({
    where: { email: { in: ['user@unique.local', 'admin@biomasse.local'] } }
  });

  // Generate proper bcrypt hash at runtime
  const bcrypt = await import('bcryptjs');
  const hashFn = bcrypt.hash || bcrypt.default?.hash;
  const hashedPassword = await hashFn('biomasse2026', 10);

  await prisma.user.create({
    data: {
      email: 'user@unique.local',
      password: hashedPassword,
      nom: 'Utilisateur',
      prenom: 'Unique',
      entreprise: 'Application',
      role: 'USER',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@biomasse.local',
      password: hashedPassword,
      nom: 'Administrateur',
      prenom: 'Système',
      entreprise: 'Application',
      role: 'ADMIN',
    },
  });
  console.log('✓ Default users created (user@unique.local / admin@biomasse.local — mot de passe: biomasse2026)');


  console.log('✓ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
