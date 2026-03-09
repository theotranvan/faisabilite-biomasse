/**
 * Calculs pour les travaux d'isolation
 * L'isolation est POUR INFORMATION UNIQUEMENT
 * Elle n'entre PAS dans le calcul du total investissement
 */

export interface IsolationPreset {
  designation: string;
  unite: string;
  prixUnitaire: number;
}

export interface LigneIsolation {
  id?: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  dejaRealise: number; // montant € (pas de quantité)
}

export interface ResultatIsolationBatiment {
  totalIsolation: number;    // qté × PU de toutes les lignes
  dejaRealise: number;       // somme des déjà réalisé
  resteARealiser: number;    // totalIsolation - dejaRealise
}

export interface BatimentIsolationRecap {
  numero: number;
  designation: string;
  totalIsolation: number;
  dejaRealise: number;
  resteARealiser: number;
}

export interface ResultatIsolationParc {
  sousTotalIsolation: number;
  totalDejaRealise: number;
  resteARealiser: number;
  batiments: BatimentIsolationRecap[];
}

/**
 * Calcule les totaux d'isolation pour UN bâtiment
 * Basé sur les lignes de travaux d'isolation
 */
export function calculerIsolationBatiment(
  lignes: LigneIsolation[]
): ResultatIsolationBatiment {
  const totalIsolation = lignes.reduce(
    (sum, ligne) => sum + ligne.quantite * ligne.prixUnitaire,
    0
  );

  const dejaRealise = lignes.reduce(
    (sum, ligne) => sum + ligne.dejaRealise,
    0
  );

  const resteARealiser = totalIsolation - dejaRealise;

  return {
    totalIsolation: Math.round(totalIsolation * 100) / 100,
    dejaRealise: Math.round(dejaRealise * 100) / 100,
    resteARealiser: Math.round(resteARealiser * 100) / 100,
  };
}

/**
 * Agrège l'isolation de tous les bâtiments d'un parc
 */
export function calculerIsolationParc(batimentsData: {
  numero: number;
  designation: string;
  lignesIsolation: LigneIsolation[];
}[]): ResultatIsolationParc {
  let sousTotalIsolation = 0;
  let totalDejaRealise = 0;

  const batimentsRecap = batimentsData.map((bat) => {
    const isoResult = calculerIsolationBatiment(bat.lignesIsolation || []);
    sousTotalIsolation += isoResult.totalIsolation;
    totalDejaRealise += isoResult.dejaRealise;

    return {
      numero: bat.numero,
      designation: bat.designation,
      totalIsolation: isoResult.totalIsolation,
      dejaRealise: isoResult.dejaRealise,
      resteARealiser: isoResult.resteARealiser,
    };
  });

  return {
    sousTotalIsolation: Math.round(sousTotalIsolation * 100) / 100,
    totalDejaRealise: Math.round(totalDejaRealise * 100) / 100,
    resteARealiser: Math.round((sousTotalIsolation - totalDejaRealise) * 100) / 100,
    batiments: batimentsRecap,
  };
}

/**
 * Intègre l'isolation dans le chiffrage de référence
 * L'isolation n'entre PAS dans l'investissement HT (juste dans les travaux ref)
 */
export function integrateIsolationInChiffrageRef(
  sousTotalChaufferie: number,
  resteARealiserIsolation: number,
  tauxBureauControle: number = 0,
  tauxMaitriseOeuvre: number = 0.13,
  tauxFraisDivers: number = 0.02,
  tauxAleas: number = 0.05
) {
  const totalFraisAnnexes =
    (tauxBureauControle +
      tauxMaitriseOeuvre +
      tauxFraisDivers +
      tauxAleas) *
    sousTotalChaufferie;

  return {
    // Isolation (pour information)
    sousTotalIsolation: resteARealiserIsolation,

    // Chaufferie
    sousTotalChaufferie,

    // Frais annexes (sur chaufferie seulement, PAS sur isolation)
    fraisAnnexes: Math.round(totalFraisAnnexes * 100) / 100,

    // Totaux TRAVAUX (avec et sans isolation pour référence)
    totalTravauxAvecIsolation: Math.round(
      (sousTotalChaufferie + resteARealiserIsolation) * 100
    ) / 100,
    totalTravauxSansIsolation: sousTotalChaufferie, // ← c'est celui qui compte

    // Investissement HT (SANS isolation)
    totalInvestissementHT: Math.round(
      (sousTotalChaufferie + totalFraisAnnexes) * 100
    ) / 100,

    // TVA et TTC (sur investissement, pas sur isolation)
    tva: Math.round(
      ((sousTotalChaufferie + totalFraisAnnexes) * 0.2) * 100
    ) / 100,
    totalTTC: Math.round(
      ((sousTotalChaufferie + totalFraisAnnexes) * 1.2) * 100
    ) / 100,
  };
}

/**
 * Données de base pour l'autocomplete isolation
 * Provient de la BDD coûts catégorie ISOLATION
 */
export const ISOLATION_PRESETS: IsolationPreset[] = [
  { designation: 'Isolation de plancher', unite: 'm2', prixUnitaire: 80 },
  { designation: 'Isolation de rampant', unite: 'm2', prixUnitaire: 120 },
  { designation: 'Isolation des combles perdus', unite: 'm2', prixUnitaire: 80 },
  {
    designation: 'Isolation des murs par l\'extérieur',
    unite: 'm2',
    prixUnitaire: 315,
  },
  {
    designation: 'Isolation des murs par l\'intérieur',
    unite: 'm2',
    prixUnitaire: 80,
  },
  { designation: 'Remplacement des menuiseries', unite: 'm2', prixUnitaire: 800 },
];

/**
 * Trouve un preset par désignation
 */
export function findIsolationPreset(designation: string) {
  return ISOLATION_PRESETS.find(
    (p) => p.designation.toLowerCase() === designation.toLowerCase()
  );
}
