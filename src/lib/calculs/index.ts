/**
 * Barrel export for calculation modules
 * Re-exports from root lib/calculs/ which contains the corrected implementations
 */

export {
  calculRendementMoyen,
  calculConsoKWhep,
  calculConsoPCS,
  calculCoutAnnuel,
  calculConsoRefCalculees,
  calculConsoRefPCS,
  calculConsoSortieChaudieresRef,
  calculCoutAnnuelRef,
  calculsBatimentInitial,
  calculsBatimentReference,
  calculsBatimentComplet,
  calculEtiquetteEnergetique,
  calculEtiquetteGlobaleProjet,
  getEtiquetteCouleur,
} from '../../../lib/calculs/batiment';

export {
  calculPuissanceChauffageParc,
  calculConsoSortieParcChaudieresRef,
  calculInvestissementHTRef,
  calculInvestissementTTCRef,
  calculAnnuiteRef,
  calculsParcComplet,
  calculConsommationsSortieChaudiereBois,
  calculConsommationsEntreeChaudiereBois,
  calculConsommationsAppoint,
  calculConso10JoursFroids,
  calculVolumeAnnuelBois,
  calculStockage10jours,
  calculVolumeCendres,
  calculHeuresPP,
  calculPertesReseau,
  calculPertesReseauParSection,
  calculConsoTotaleAvecPertes,
  calculNbLivraisons,
  calculVolumeSiloRecommande,
  calculKmHaie,
  calculSteresAn,
  PERTES_RESEAU_KW_PER_ML,
  HEURES_RESEAU_AN,
  PART_CONSO_10_JOURS_FROIDS,
  MASSE_VOLUMIQUE_CENDRES,
} from '../../../lib/calculs/parc';

export {
  calculBilan20Ans,
  calculBilanComplet,
  calculTotalEconomies20ans,
  calculCO2Emissions,
  calculSO2Emissions,
  getEmissionFactor,
  EMISSION_FACTORS,
} from '../../../lib/calculs/bilan';

export {
  calculSousTotalChaufferie,
  calculFraisAnnexes,
  calculTotalInvestissementHT,
  calculTVA,
  calculTotalInvestissementTTC,
  calculAnnuite,
  calculChiffrageComplet,
} from '../../../lib/calculs/chiffrage';

export {
  calculerIsolationBatiment,
  calculerIsolationParc,
  integrateIsolationInChiffrageRef,
  ISOLATION_PRESETS,
  findIsolationPreset,
} from '../../../lib/calculs/isolation';

export type {
  IsolationPreset,
  LigneIsolation,
  ResultatIsolationBatiment,
  BatimentIsolationRecap,
  ResultatIsolationParc,
} from '../../../lib/calculs/isolation';

export type {
  EtatEnergie,
  Batiment,
  ChiffrageItem,
  FraisAnnexes,
  ChiffrageParcRef,
  CalculsBatiment,
  CalculsParc,
  MonotoneDataPoint,
  CalculsMonotone,
  AnnualCost,
  BilanActualize,
} from '../../../lib/calculs/types';
