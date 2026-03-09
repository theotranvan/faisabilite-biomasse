/**
 * Calculs pour un Parc (réseau de chaleur + biomasse)
 */

import { CalculsParc } from '@/types';

export function calculConsommationsSortieChaudiereBois(
  consommationsBatimentsParc: number,
  pourcentageCouvertureBois: number
): number {
  return (consommationsBatimentsParc * pourcentageCouvertureBois) / 100;
}

export function calculConsommationsEntreeChaudiereBois(
  consommationsSortieChaudiereBois: number,
  rendementChaudiereBois: number
): number {
  return consommationsSortieChaudiereBois / (rendementChaudiereBois / 100);
}

export function calculConsommationsAppoint(
  consommationsBatimentsParc: number,
  pourcentageCouvertureBois: number,
  rendementChaudiere2: number
): number {
  const sortie =
    (consommationsBatimentsParc * (100 - pourcentageCouvertureBois)) / 100;
  return sortie / (rendementChaudiere2 / 100);
}

export function calculStockage10jours(
  consommation10joursKwh: number,
  pci: number, // MWh/t
  masseVolumique: number // kg/m³
): { tonnes: number; m3: number } {
  const tonnes = consommation10joursKwh / (pci * 1000);
  const m3 = (tonnes * 1000) / masseVolumique;
  return { tonnes, m3 };
}

export function calculVolumeCendres(
  consommationsEntreeChaudiereBois: number,
  tauxCendre: number,
  masseVolumique: number
): { m3: number; kg: number } {
  const m3 = (consommationsEntreeChaudiereBois * tauxCendre) / masseVolumique;
  const kg = m3 * masseVolumique;
  return { m3, kg };
}

export function calculHeuresPP(
  consommationsSortieChaudiereBois: number,
  puissanceChaudiereBois: number
): number {
  return consommationsSortieChaudiereBois / puissanceChaudiereBois;
}

export function calculPertesReseau(
  longueurReseau: number,
  pertesKwPerMl: number
): number {
  return longueurReseau * pertesKwPerMl;
}

export function calculParc(
  deperditionsParc: number, // total des déperditions du parc
  consommationsBatimentsParc: number, // sortie chaudière de référence
  longueurReseau: number,
  pertesKwPerMl: number,
  puissanceChaudiereBois: number,
  rendementChaudiereBois: number,
  _puissanceChaudiere2: number,
  _rendementChaudiere2: number,
  pourcentageCouvertureBois: number,
  pci: number,
  masseVolumique: number,
  tauxCendre: number
): CalculsParc {
  const pertesReseau = calculPertesReseau(longueurReseau, pertesKwPerMl);
  const consommationsSortieChaudiereBois = calculConsommationsSortieChaudiereBois(
    consommationsBatimentsParc,
    pourcentageCouvertureBois
  );
  const consommationsEntreeChaudiereBois = calculConsommationsEntreeChaudiereBois(
    consommationsSortieChaudiereBois,
    rendementChaudiereBois
  );
  const consommationsSortieChaudiereAppoint = calculConsommationsAppoint(
    consommationsBatimentsParc,
    pourcentageCouvertureBois,
    _rendementChaudiere2
  );
  const consommationsEntreeChaudiereAppoint = consommationsSortieChaudiereAppoint;
  const stockage10jours = calculStockage10jours(
    (consommationsEntreeChaudiereBois / 365) * 10,
    pci,
    masseVolumique
  );
  const volumeCendres = calculVolumeCendres(
    consommationsEntreeChaudiereBois,
    tauxCendre,
    masseVolumique
  );
  const heuresPP = calculHeuresPP(consommationsSortieChaudiereBois, puissanceChaudiereBois);

  return {
    puissanceChauffageParc: deperditionsParc,
    consommationsBatimentsParc,
    pertesReseau,
    consommationsSortieChaudiereBois,
    consommationsEntreeChaudiereBois,
    consommationsSortieChaudiereAppoint,
    consommationsEntreeChaudiereAppoint,
    stockage10jours,
    volumeCendres,
    heuresPP,
  };
}

/**
 * Monotone de charge
 */
export interface MonotonePoint {
  heure: number;
  puissance: number;
  triee?: boolean;
}

export function calculMonotoneDeCharge(
  temperatures: number[], // 8760 values
  deperditionsTotal: number, // W/°C
  tempIntBase: number
): MonotonePoint[] {
  const points: MonotonePoint[] = temperatures.map((tempExt, heure) => {
    const puissance = Math.max(0, deperditionsTotal * 1000 * (tempIntBase - tempExt));
    return { heure, puissance };
  });

  // Trier par puissance décroissante
  const triePoints = [...points].sort((a, b) => b.puissance - a.puissance);

  return triePoints.map((p, index) => ({
    ...p,
    triee: true,
    heure: index, // renumber for monotone curve
  }));
}
