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
} from '../../../lib/calculs/batiment';

export {
  calculPuissanceChauffageParc,
  calculConsoSortieParcChaudieresRef,
  calculInvestissementHTRef,
  calculInvestissementTTCRef,
  calculAnnuiteRef,
  calculsParcComplet,
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
