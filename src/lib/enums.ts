/**
 * Centralized enums and constants for the application
 */

/**
 * Energy types used throughout the application
 * Keep consistent naming - use singular form in French
 */
export const ENERGY_TYPES = {
  FUEL: 'Fuel',
  NATURAL_GAS: 'Gaz naturel',
  PROPANE: 'Gaz propane',
  ELECTRICITY: 'Electricité',
  WOOD_CHIPS: 'Bois plaquette',
  WOOD_PELLETS: 'Bois granulé',
  BIOMASS: 'Plaquette',
  PELLETS: 'Granulé',
} as const;

export type EnergyType = typeof ENERGY_TYPES[keyof typeof ENERGY_TYPES];

/**
 * Installation types with their performance characteristics
 */
export const INSTALLATION_TYPES = {
  VERY_OLD: 'ancien_ancien',
  OLD_GOOD: 'ancien_bon',
  MODERN: 'moderne',
  CONDENSATION: 'condensation',
} as const;

/**
 * Biomass boiler sizes and costs
 */
export const BOILER_SIZES = [
  { power: 50, label: '50 kW', price: 25000 },
  { power: 80, label: '80 kW', price: 30500 },
  { power: 100, label: '100 kW', price: 36400 },
  { power: 150, label: '150 kW', price: 52650 },
  { power: 200, label: '200 kW', price: 63000 },
  { power: 300, label: '300 kW', price: 75000 },
] as const;

/**
 * Isolation work types preset values
 */
export const ISOLATION_TYPES = {
  FLOOR: { designation: 'Isolation de plancher', unite: 'm²', prixUnitaire: 80 },
  RAMPANT: { designation: 'Isolation de rampant', unite: 'm²', prixUnitaire: 120 },
  ATTIC: { designation: 'Isolation des combles perdus', unite: 'm²', prixUnitaire: 80 },
  EXTERNAL_WALLS: { designation: 'Isolation des murs par l\'extérieur', unite: 'm²', prixUnitaire: 315 },
  INTERNAL_WALLS: { designation: 'Isolation des murs par l\'intérieur', unite: 'm²', prixUnitaire: 80 },
  WINDOWS: { designation: 'Remplacement des menuiseries', unite: 'm²', prixUnitaire: 800 },
} as const;

/**
 * Project status values
 */
export const PROJECT_STATUS = {
  DRAFT: 'BROUILLON',
  IN_PROGRESS: 'EN_COURS',
  COMPLETED: 'TERMINEE',
  ARCHIVED: 'ARCHIVE',
} as const;

/**
 * All French departments (96 + 2A/2B Corse)
 * Used in affaire creation and detail forms
 */
export const DEPARTEMENTS = [
  { value: '01', label: '01 - Ain' },
  { value: '02', label: '02 - Aisne' },
  { value: '03', label: '03 - Allier' },
  { value: '04', label: '04 - Alpes-de-Haute-Provence' },
  { value: '05', label: '05 - Hautes-Alpes' },
  { value: '06', label: '06 - Alpes-Maritimes' },
  { value: '07', label: '07 - Ardèche' },
  { value: '08', label: '08 - Ardennes' },
  { value: '09', label: '09 - Ariège' },
  { value: '10', label: '10 - Aube' },
  { value: '11', label: '11 - Aude' },
  { value: '12', label: '12 - Aveyron' },
  { value: '13', label: '13 - Bouches-du-Rhône' },
  { value: '14', label: '14 - Calvados' },
  { value: '15', label: '15 - Cantal' },
  { value: '16', label: '16 - Charente' },
  { value: '17', label: '17 - Charente-Maritime' },
  { value: '18', label: '18 - Cher' },
  { value: '19', label: '19 - Corrèze' },
  { value: '2A', label: '2A - Corse-du-Sud' },
  { value: '2B', label: '2B - Haute-Corse' },
  { value: '21', label: '21 - Côte-d\'Or' },
  { value: '22', label: '22 - Côtes-d\'Armor' },
  { value: '23', label: '23 - Creuse' },
  { value: '24', label: '24 - Dordogne' },
  { value: '25', label: '25 - Doubs' },
  { value: '26', label: '26 - Drôme' },
  { value: '27', label: '27 - Eure' },
  { value: '28', label: '28 - Eure-et-Loir' },
  { value: '29', label: '29 - Finistère' },
  { value: '30', label: '30 - Gard' },
  { value: '31', label: '31 - Haute-Garonne' },
  { value: '32', label: '32 - Gers' },
  { value: '33', label: '33 - Gironde' },
  { value: '34', label: '34 - Hérault' },
  { value: '35', label: '35 - Ille-et-Vilaine' },
  { value: '36', label: '36 - Indre' },
  { value: '37', label: '37 - Indre-et-Loire' },
  { value: '38', label: '38 - Isère' },
  { value: '39', label: '39 - Jura' },
  { value: '40', label: '40 - Landes' },
  { value: '41', label: '41 - Loir-et-Cher' },
  { value: '42', label: '42 - Loire' },
  { value: '43', label: '43 - Haute-Loire' },
  { value: '44', label: '44 - Loire-Atlantique' },
  { value: '45', label: '45 - Loiret' },
  { value: '46', label: '46 - Lot' },
  { value: '47', label: '47 - Lot-et-Garonne' },
  { value: '48', label: '48 - Lozère' },
  { value: '49', label: '49 - Maine-et-Loire' },
  { value: '50', label: '50 - Manche' },
  { value: '51', label: '51 - Marne' },
  { value: '52', label: '52 - Haute-Marne' },
  { value: '53', label: '53 - Mayenne' },
  { value: '54', label: '54 - Meurthe-et-Moselle' },
  { value: '55', label: '55 - Meuse' },
  { value: '56', label: '56 - Morbihan' },
  { value: '57', label: '57 - Moselle' },
  { value: '58', label: '58 - Nièvre' },
  { value: '59', label: '59 - Nord' },
  { value: '60', label: '60 - Oise' },
  { value: '61', label: '61 - Orne' },
  { value: '62', label: '62 - Pas-de-Calais' },
  { value: '63', label: '63 - Puy-de-Dôme' },
  { value: '64', label: '64 - Pyrénées-Atlantiques' },
  { value: '65', label: '65 - Hautes-Pyrénées' },
  { value: '66', label: '66 - Pyrénées-Orientales' },
  { value: '67', label: '67 - Bas-Rhin' },
  { value: '68', label: '68 - Haut-Rhin' },
  { value: '69', label: '69 - Rhône' },
  { value: '70', label: '70 - Haute-Saône' },
  { value: '71', label: '71 - Saône-et-Loire' },
  { value: '72', label: '72 - Sarthe' },
  { value: '73', label: '73 - Savoie' },
  { value: '74', label: '74 - Haute-Savoie' },
  { value: '75', label: '75 - Paris' },
  { value: '76', label: '76 - Seine-Maritime' },
  { value: '77', label: '77 - Seine-et-Marne' },
  { value: '78', label: '78 - Yvelines' },
  { value: '79', label: '79 - Deux-Sèvres' },
  { value: '80', label: '80 - Somme' },
  { value: '81', label: '81 - Tarn' },
  { value: '82', label: '82 - Tarn-et-Garonne' },
  { value: '83', label: '83 - Var' },
  { value: '84', label: '84 - Vaucluse' },
  { value: '85', label: '85 - Vendée' },
  { value: '86', label: '86 - Vienne' },
  { value: '87', label: '87 - Haute-Vienne' },
  { value: '88', label: '88 - Vosges' },
  { value: '89', label: '89 - Yonne' },
  { value: '90', label: '90 - Territoire de Belfort' },
  { value: '91', label: '91 - Essonne' },
  { value: '92', label: '92 - Hauts-de-Seine' },
  { value: '93', label: '93 - Seine-Saint-Denis' },
  { value: '94', label: '94 - Val-de-Marne' },
  { value: '95', label: '95 - Val-d\'Oise' },
];

/**
 * Energy tariff presets from Excel (Energies sheet)
 * Maps internal energy code to default tarif (€TTC/kWh) and abonnement (€/an)
 */
export const ENERGY_TARIFS: Record<string, { tarification: number; abonnement: number }> = {
  FUEL: { tarification: 0.13, abonnement: 0 },
  GAZ_NATUREL: { tarification: 0.0978, abonnement: 0 },
  GAZ_PROPANE: { tarification: 0.1652, abonnement: 0 },
  ELECTRICITE: { tarification: 0.226, abonnement: 0 },
  BOIS_DECHIQUETTE: { tarification: 0.053, abonnement: 0 },
  BOIS_GRANULES: { tarification: 0.1162, abonnement: 0 },
};

/**
 * Building type → coefficient d'intermittence (from Excel Utile sheet)
 */
export const COEF_INTERMITTENCE: Record<string, number> = {
  LOGEMENTS: 1.0,
  BUREAUX: 0.85,
  OCCUPATION_CONTINUE: 1.0,
  AUTRES: 0.80,
};

/**
 * Installation type presets with 4 rendements (from Excel)
 */
export const TYPES_INSTALLATION = [
  {
    value: 'ancien_ancien',
    label: 'Très ancienne chaudière (années 60-70)',
    rendementProduction: 77.5,
    rendementDistribution: 82.5,
    rendementEmission: 92.5,
    rendementRegulation: 87.5,
  },
  {
    value: 'ancien_bon',
    label: 'Ancienne chaudière (bien dimensionnée)',
    rendementProduction: 82.5,
    rendementDistribution: 92.5,
    rendementEmission: 95,
    rendementRegulation: 90,
  },
  {
    value: 'moderne',
    label: 'Chaudière haut rendement (années 90-2000)',
    rendementProduction: 91.5,
    rendementDistribution: 95,
    rendementEmission: 96.5,
    rendementRegulation: 95,
  },
  {
    value: 'condensation',
    label: 'Chaudière gaz à condensation (moderne)',
    rendementProduction: 102,
    rendementDistribution: 95,
    rendementEmission: 96.5,
    rendementRegulation: 95,
  },
] as const;

/**
 * Département → villeMonotone closest mapping
 * Based on geographic proximity of each département to one of the 11 monotone cities
 */
export const DEPT_TO_VILLE_MONOTONE: Record<string, string> = {
  '01': 'Vichy', '02': 'Paris', '03': 'Vichy', '04': 'Vichy',
  '05': 'Vichy', '06': 'Vichy', '07': 'Vichy', '08': 'Paris',
  '09': 'Vichy', '10': 'Paris', '11': 'Vichy', '12': 'Vichy',
  '13': 'Vichy', '14': 'Tours', '15': 'Vichy', '16': 'Poitiers',
  '17': 'Poitiers', '18': 'Bourges', '19': 'Limoges', '2A': 'Vichy',
  '2B': 'Vichy', '21': 'Nevers', '22': 'Tours', '23': 'Gueret',
  '24': 'Limoges', '25': 'Nevers', '26': 'Vichy', '27': 'Paris',
  '28': 'Chartres', '29': 'Tours', '30': 'Vichy', '31': 'Vichy',
  '32': 'Vichy', '33': 'Poitiers', '34': 'Vichy', '35': 'Tours',
  '36': 'Chateauroux', '37': 'Tours', '38': 'Vichy', '39': 'Nevers',
  '40': 'Poitiers', '41': 'Tours', '42': 'Vichy', '43': 'Vichy',
  '44': 'Tours', '45': 'Orleans', '46': 'Vichy', '47': 'Vichy',
  '48': 'Vichy', '49': 'Tours', '50': 'Tours', '51': 'Paris',
  '52': 'Paris', '53': 'Tours', '54': 'Paris', '55': 'Paris',
  '56': 'Tours', '57': 'Paris', '58': 'Nevers', '59': 'Paris',
  '60': 'Paris', '61': 'Tours', '62': 'Paris', '63': 'Vichy',
  '64': 'Poitiers', '65': 'Vichy', '66': 'Vichy', '67': 'Paris',
  '68': 'Paris', '69': 'Vichy', '70': 'Nevers', '71': 'Nevers',
  '72': 'Tours', '73': 'Vichy', '74': 'Vichy', '75': 'Paris',
  '76': 'Paris', '77': 'Paris', '78': 'Paris', '79': 'Poitiers',
  '80': 'Paris', '81': 'Vichy', '82': 'Vichy', '83': 'Vichy',
  '84': 'Vichy', '85': 'Poitiers', '86': 'Poitiers', '87': 'Limoges',
  '88': 'Paris', '89': 'Nevers', '90': 'Nevers', '91': 'Paris',
  '92': 'Paris', '93': 'Paris', '94': 'Paris', '95': 'Paris',
};

/**
 * Biomass characteristics from Excel (Car_biomasse sheet)
 * PCI in kWh/kg, masse volumique in kg/m³, taux cendre in %
 */
export const BIOMASSE_CHARACTERISTICS: Record<string, { pci: number; masseVolumique: number; tauxCendre: number; tauxHumidite: number }> = {
  PLAQUETTE: { pci: 3.8, masseVolumique: 225, tauxCendre: 0.01, tauxHumidite: 0.30 },
  GRANULES: { pci: 4.6, masseVolumique: 650, tauxCendre: 0.005, tauxHumidite: 0.08 },
  MISCANTHUS: { pci: 4.2, masseVolumique: 120, tauxCendre: 0.03, tauxHumidite: 0.20 },
  BUCHES: { pci: 4.0, masseVolumique: 420, tauxCendre: 0.01, tauxHumidite: 0.20 },
};
