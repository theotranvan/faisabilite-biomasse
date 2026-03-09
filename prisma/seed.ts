import { PrismaClient } from '@prisma/client';

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
  { combustible: 'Électricité', co2PerKwh: 0.210, so2PerKwh: 0.00086 },
];

const bddCoutsData = [
  // ISOLATION
  { categorie: 'ISOLATION', designation: 'Isolation de plancher', unite: 'm²', prixUnitaire: 80 },
  { categorie: 'ISOLATION', designation: 'Isolation de rampant', unite: 'm²', prixUnitaire: 120 },
  { categorie: 'ISOLATION', designation: 'Isolation des combles perdus', unite: 'm²', prixUnitaire: 80 },
  { categorie: 'ISOLATION', designation: 'Isolation des murs par l\'extérieur', unite: 'm²', prixUnitaire: 315 },
  { categorie: 'ISOLATION', designation: 'Isolation des murs par l\'intérieur', unite: 'm²', prixUnitaire: 80 },
  { categorie: 'ISOLATION', designation: 'Remplacement des menuiseries', unite: 'm²', prixUnitaire: 800 },
  // EQUIPEMENTS
  { categorie: 'EQUIPEMENTS', designation: 'GTC', unite: 'Ens', prixUnitaire: 5000 },
  { categorie: 'EQUIPEMENTS', designation: 'Compteurs énergie', unite: 'U', prixUnitaire: 1300 },
  { categorie: 'EQUIPEMENTS', designation: 'Ballon tampon 750l', unite: 'U', prixUnitaire: 2500 },
  { categorie: 'EQUIPEMENTS', designation: 'Désemboueur', unite: 'U', prixUnitaire: 2000 },
  { categorie: 'EQUIPEMENTS', designation: 'Vase expansion', unite: 'U', prixUnitaire: 400 },
  { categorie: 'EQUIPEMENTS', designation: 'Tube acier DN50', unite: 'ml', prixUnitaire: 57 },
  { categorie: 'EQUIPEMENTS', designation: 'Calorifugeage', unite: 'ml', prixUnitaire: 15 },
  { categorie: 'EQUIPEMENTS', designation: 'Pompe double', unite: 'U', prixUnitaire: 3000 },
  { categorie: 'EQUIPEMENTS', designation: 'Bouteille de mélange', unite: 'U', prixUnitaire: 500 },
  // CHAUFFERIE_BIOMASSE
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 50 kW', unite: 'U', prixUnitaire: 25000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 80 kW', unite: 'U', prixUnitaire: 30500 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 100 kW', unite: 'U', prixUnitaire: 36400 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 150 kW', unite: 'U', prixUnitaire: 52650 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 200 kW', unite: 'U', prixUnitaire: 63000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Chaudière Bois 300 kW', unite: 'U', prixUnitaire: 75000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Fumisterie', unite: 'Ens', prixUnitaire: 4000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Collecteur', unite: 'Ens', prixUnitaire: 6000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Calorifuge', unite: 'Ens', prixUnitaire: 3000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Ballon tampon', unite: 'Ens', prixUnitaire: 3000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Trémie de transfert', unite: 'U', prixUnitaire: 18000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'GTC', unite: 'Ens', prixUnitaire: 9000 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Réseau de chaleur', unite: 'ml', prixUnitaire: 80 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Tranchées + réseau chaleur', unite: 'ml', prixUnitaire: 174 },
  { categorie: 'CHAUFFERIE_BIOMASSE', designation: 'Sous station', unite: 'U', prixUnitaire: 3000 },
  // CHAUFFAGE_BATIMENTS
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Radiateur', unite: 'U', prixUnitaire: 350 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Réseau de chauffage', unite: 'Ens', prixUnitaire: 3500 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Ballon échangeur', unite: 'U', prixUnitaire: 1800 },
  { categorie: 'CHAUFFAGE_BATIMENTS', designation: 'Groupe mélange + régul', unite: 'U', prixUnitaire: 2000 },
];

const pertesReseauData = [
  { section: 'DN25', pertesKwPerMl: 0.007 },
  { section: 'DN32', pertesKwPerMl: 0.009 },
  { section: 'DN40', pertesKwPerMl: 0.010 },
  { section: 'DN50', pertesKwPerMl: 0.012 },
];

// Sample DJU data for major departments
const meteoMoyenneData = [
  { departement: 'Ain', code: '01', djuMoyenne: 2450 },
  { departement: 'Aisne', code: '02', djuMoyenne: 2290 },
  { departement: 'Allier', code: '03', djuMoyenne: 2350 },
  { departement: 'Alpes-de-Haute-Provence', code: '04', djuMoyenne: 2100 },
  { departement: 'Hautes-Alpes', code: '05', djuMoyenne: 2180 },
  { departement: 'Ardèche', code: '07', djuMoyenne: 2100 },
  { departement: 'Ardennes', code: '08', djuMoyenne: 2450 },
  { departement: 'Ariège', code: '09', djuMoyenne: 2200 },
  { departement: 'Aube', code: '10', djuMoyenne: 2350 },
  { departement: 'Aude', code: '11', djuMoyenne: 1950 },
  { departement: 'Aveyron', code: '12', djuMoyenne: 2300 },
  { departement: 'Bouches-du-Rhône', code: '13', djuMoyenne: 1850 },
  { departement: 'Calvados', code: '14', djuMoyenne: 2100 },
  { departement: 'Cantal', code: '15', djuMoyenne: 2500 },
  { departement: 'Charente', code: '16', djuMoyenne: 2000 },
  { departement: 'Charente-Maritime', code: '17', djuMoyenne: 1950 },
  { departement: 'Cher', code: '18', djuMoyenne: 2250 },
  { departement: 'Corrèze', code: '19', djuMoyenne: 2350 },
  { departement: 'Corse-du-Sud', code: '20', djuMoyenne: 1650 },
  { departement: 'Côte-d\'Or', code: '21', djuMoyenne: 2400 },
  { departement: 'Côtes-d\'Armor', code: '22', djuMoyenne: 2200 },
  { departement: 'Creuse', code: '23', djuMoyenne: 2450 },
  { departement: 'Dordogne', code: '24', djuMoyenne: 2050 },
  { departement: 'Doubs', code: '25', djuMoyenne: 2550 },
  { departement: 'Drôme', code: '26', djuMoyenne: 2050 },
  { departement: 'Eure', code: '27', djuMoyenne: 2300 },
  { departement: 'Eure-et-Loir', code: '28', djuMoyenne: 2350 },
  { departement: 'Finistère', code: '29', djuMoyenne: 2200 },
  { departement: 'Gard', code: '30', djuMoyenne: 1900 },
  { departement: 'Haute-Garonne', code: '31', djuMoyenne: 2100 },
  { departement: 'Gers', code: '32', djuMoyenne: 1950 },
  { departement: 'Gironde', code: '33', djuMoyenne: 1950 },
  { departement: 'Hérault', code: '34', djuMoyenne: 1850 },
  { departement: 'Ille-et-Vilaine', code: '35', djuMoyenne: 2150 },
  { departement: 'Indre', code: '36', djuMoyenne: 2300 },
  { departement: 'Indre-et-Loire', code: '37', djuMoyenne: 2200 },
  { departement: 'Isère', code: '38', djuMoyenne: 2350 },
  { departement: 'Jura', code: '39', djuMoyenne: 2600 },
  { departement: 'Landes', code: '40', djuMoyenne: 1850 },
  { departement: 'Loir-et-Cher', code: '41', djuMoyenne: 2300 },
  { departement: 'Loire', code: '42', djuMoyenne: 2350 },
  { departement: 'Haute-Loire', code: '43', djuMoyenne: 2450 },
  { departement: 'Loire-Atlantique', code: '44', djuMoyenne: 2050 },
  { departement: 'Loiret', code: '45', djuMoyenne: 2350 },
  { departement: 'Lot', code: '46', djuMoyenne: 2050 },
  { departement: 'Lot-et-Garonne', code: '47', djuMoyenne: 1950 },
  { departement: 'Lozère', code: '48', djuMoyenne: 2550 },
  { departement: 'Maine-et-Loire', code: '49', djuMoyenne: 2100 },
  { departement: 'Manche', code: '50', djuMoyenne: 2100 },
  { departement: 'Marne', code: '51', djuMoyenne: 2400 },
  { departement: 'Haute-Marne', code: '52', djuMoyenne: 2550 },
  { departement: 'Mayenne', code: '53', djuMoyenne: 2150 },
  { departement: 'Meurthe-et-Moselle', code: '54', djuMoyenne: 2450 },
  { departement: 'Meuse', code: '55', djuMoyenne: 2500 },
  { departement: 'Morbihan', code: '56', djuMoyenne: 2100 },
  { departement: 'Moselle', code: '57', djuMoyenne: 2450 },
  { departement: 'Nièvre', code: '58', djuMoyenne: 2400 },
  { departement: 'Nord', code: '59', djuMoyenne: 2550 },
  { departement: 'Oise', code: '60', djuMoyenne: 2350 },
  { departement: 'Orne', code: '61', djuMoyenne: 2200 },
  { departement: 'Pas-de-Calais', code: '62', djuMoyenne: 2450 },
  { departement: 'Puy-de-Dôme', code: '63', djuMoyenne: 2450 },
  { departement: 'Pyrénées-Atlantiques', code: '64', djuMoyenne: 1900 },
  { departement: 'Hautes-Pyrénées', code: '65', djuMoyenne: 2200 },
  { departement: 'Pyrénées-Orientales', code: '66', djuMoyenne: 1750 },
  { departement: 'Bas-Rhin', code: '67', djuMoyenne: 2400 },
  { departement: 'Haut-Rhin', code: '68', djuMoyenne: 2350 },
  { departement: 'Rhône', code: '69', djuMoyenne: 2250 },
  { departement: 'Haute-Saône', code: '70', djuMoyenne: 2550 },
  { departement: 'Saône-et-Loire', code: '71', djuMoyenne: 2350 },
  { departement: 'Sarthe', code: '72', djuMoyenne: 2200 },
  { departement: 'Savoie', code: '73', djuMoyenne: 2550 },
  { departement: 'Haute-Savoie', code: '74', djuMoyenne: 2600 },
  { departement: 'Seine-Maritime', code: '76', djuMoyenne: 2300 },
  { departement: 'Seine-et-Marne', code: '77', djuMoyenne: 2350 },
  { departement: 'Yvelines', code: '78', djuMoyenne: 2350 },
  { departement: 'Deux-Sèvres', code: '79', djuMoyenne: 2050 },
  { departement: 'Somme', code: '80', djuMoyenne: 2450 },
  { departement: 'Tarn', code: '81', djuMoyenne: 2050 },
  { departement: 'Tarn-et-Garonne', code: '82', djuMoyenne: 1950 },
  { departement: 'Var', code: '83', djuMoyenne: 1800 },
  { departement: 'Vaucluse', code: '84', djuMoyenne: 1950 },
  { departement: 'Vendée', code: '85', djuMoyenne: 2050 },
  { departement: 'Vienne', code: '86', djuMoyenne: 2000 },
  { departement: 'Haute-Vienne', code: '87', djuMoyenne: 2200 },
  { departement: 'Vosges', code: '88', djuMoyenne: 2550 },
  { departement: 'Yonne', code: '89', djuMoyenne: 2400 },
  { departement: 'Territoire de Belfort', code: '90', djuMoyenne: 2550 },
  { departement: 'Essonne', code: '91', djuMoyenne: 2350 },
  { departement: 'Hauts-de-Seine', code: '92', djuMoyenne: 2350 },
  { departement: 'Seine-Saint-Denis', code: '93', djuMoyenne: 2350 },
  { departement: 'Val-de-Marne', code: '94', djuMoyenne: 2350 },
  { departement: 'Val-d\'Oise', code: '95', djuMoyenne: 2350 },
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

  // Create Default User for mono-client app
  // First delete if exists
  await prisma.user.deleteMany({
    where: { email: 'user@unique.local' }
  });

  await prisma.user.create({
    data: {
      email: 'user@unique.local',
      password: 'hashed_no_password',
      nom: 'Utilisateur',
      prenom: 'Unique',
      entreprise: 'Application',
      role: 'USER',
    },
  });
  console.log('✓ Default unique user created');

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
