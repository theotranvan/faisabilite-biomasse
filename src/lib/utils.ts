/**
 * Utility functions for the Biomasse Faisabilité application
 */

/**
 * Format currency in EUR
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format large numbers with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format date in French format (dd/mm/yyyy)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Generate affaire reference number (AF-YYYY-###)
 */
export function generateAffaireReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `AF-${year}-${random}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Check if a value is a positive number
 */
export function isPositiveNumber(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Convert TEP to kWh
 * 1 TEP = 11,630 kWh
 */
export function tepToKwh(tep: number): number {
  return tep * 11630;
}

/**
 * Convert kWh to TEP
 */
export function kwhToTep(kwh: number): number {
  return kwh / 11630;
}

/**
 * Get color for energy label (A-G)
 */
export function getEnergyLabelColor(label: string): string {
  const colors: Record<string, string> = {
    A: '#10b981', // green
    B: '#84cc16', // lime
    C: '#eab308', // yellow
    D: '#f97316', // orange
    E: '#ef4444', // red
    F: '#dc2626', // dark red
    G: '#7f1d1d', // very dark red
  };
  return colors[label] || '#6b7280';
}

/**
 * Get description for energy label
 */
export function getEnergyLabelDescription(label: string): string {
  const descriptions: Record<string, string> = {
    A: 'Très efficace',
    B: 'Efficace',
    C: 'Normal',
    D: 'Assez élevé',
    E: 'Élevé',
    F: 'Très élevé',
    G: 'Extrêmement élevé',
  };
  return descriptions[label] || 'Inconnu';
}

/**
 * Validate building data before calculations
 */
export function validateBatimentData(batiment: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!batiment.deperditions || batiment.deperditions <= 0) {
    errors.push('Les déperditions doivent être > 0');
  }

  if (!batiment.surfaceChauffee || batiment.surfaceChauffee <= 0) {
    errors.push('La surface chauffée doit être > 0');
  }

  if (
    batiment.rendementProduction < 50 ||
    batiment.rendementProduction > 100
  ) {
    errors.push('Rendement production doit être entre 50% et 100%');
  }

  if (
    batiment.rendementDistribution < 50 ||
    batiment.rendementDistribution > 100
  ) {
    errors.push('Rendement distribution doit être entre 50% et 100%');
  }

  if (batiment.rendementEmission < 50 || batiment.rendementEmission > 100) {
    errors.push('Rendement émission doit être entre 50% et 100%');
  }

  if (
    batiment.rendementRegulation < 50 ||
    batiment.rendementRegulation > 100
  ) {
    errors.push('Rendement régulation doit être entre 50% et 100%');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate parc biomass data
 */
export function validateParcBiomasse(parc: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!parc.puissanceChaudiereBois || parc.puissanceChaudiereBois <= 0) {
    errors.push('Puissance chaudière bois doit être > 0');
  }

  if (!parc.rendementChaudiereBois || parc.rendementChaudiereBois <= 0) {
    errors.push('Rendement chaudière bois doit être > 0');
  }

  if (parc.pourcentageCouvertureBois < 0 || parc.pourcentageCouvertureBois > 100) {
    errors.push('% couverture doit être entre 0 et 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Debounce function for auto-save
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get biomass type label
 */
export function getBiomasseLabel(type: string): string {
  const labels: Record<string, string> = {
    PLAQUETTE: 'Plaquettes',
    GRANULES: 'Granulés',
    MISCANTHUS: 'Miscanthus',
    BUCHES: 'Bûches',
  };
  return labels[type] || type;
}

/**
 * Get building type label
 */
export function getBatimentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LOGEMENTS: 'Logements',
    BUREAUX: 'Bâtiments administratifs',
    OCCUPATION_CONTINUE: 'Occupation continue',
    AUTRES: 'Autres bâtiments',
  };
  return labels[type] || type;
}

/**
 * Get energy type label
 */
export function getEnergieLabel(type: string): string {
  const labels: Record<string, string> = {
    FUEL: 'Fioul',
    GAZ_NATUREL: 'Gaz naturel',
    GAZ_PROPANE: 'Gaz propane',
    ELECTRICITE: 'Électricité',
    BOIS_DECHIQUETTE: 'Bois déchiquetté',
    BOIS_GRANULES: 'Bois granulés',
  };
  return labels[type] || type;
}

/**
 * Parse JSON safely
 */
export function parseJSON<T = any>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty (null, undefined, empty string)
 */
export function isEmpty(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}
