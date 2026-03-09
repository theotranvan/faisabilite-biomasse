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
