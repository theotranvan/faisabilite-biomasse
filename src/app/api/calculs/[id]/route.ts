import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  calculsBatimentComplet,
  calculPuissanceChauffageParc,
  calculConsoSortieParcChaudieresRef,
  calculInvestissementHTRef,
  calculInvestissementTTCRef,
  calculAnnuiteRef,
  calculBilan20Ans,
  calculConsommationsEntreeChaudiereBois,
  calculConsommationsSortieChaudiereBois,
  calculConsommationsAppoint,
  calculEtiquetteEnergetique,
} from '@/lib/calculs';
import type { Batiment, EtatEnergie } from '@/lib/calculs';

/**
 * Transform flat Prisma batiment row into nested Batiment type for calculation functions
 */
function transformBatiment(row: any): Batiment {
  const etatInitial: EtatEnergie = {
    deperditions_kW: row.deperditions ?? 0,
    rendementProduction: row.rendementProduction ?? 80,
    rendementDistribution: row.rendementDistribution ?? 85,
    rendementEmission: row.rendementEmission ?? 90,
    rendementRegulation: row.rendementRegulation ?? 95,
    coefIntermittence: row.coefIntermittence ?? 1,
    consommationsCalculees: row.consommationsCalculees ?? 0,
    consommationsReelles: row.consommationsReelles ?? undefined,
    typeEnergie: mapEnergyType(row.typeEnergie),
    tarification: row.tarification ?? 0,
    abonnement: row.abonnement ?? 0,
  };

  let etatReference: EtatEnergie | null = null;
  if (row.refDeperditions != null || row.refRendementProduction != null) {
    etatReference = {
      deperditions_kW: row.refDeperditions ?? row.deperditions ?? 0,
      rendementProduction: row.refRendementProduction ?? row.rendementProduction ?? 80,
      rendementDistribution: row.refRendementDistribution ?? row.rendementDistribution ?? 85,
      rendementEmission: row.refRendementEmission ?? row.rendementEmission ?? 90,
      rendementRegulation: row.refRendementRegulation ?? row.rendementRegulation ?? 95,
      coefIntermittence: row.coefIntermittence ?? 1,
      consommationsCalculees: 0,
      typeEnergie: mapEnergyType(row.refTypeEnergie || row.typeEnergie),
      tarification: row.refTarification ?? row.tarification ?? 0,
      abonnement: row.refAbonnement ?? row.abonnement ?? 0,
    };
  }

  return {
    numero: row.numero,
    designation: row.designation ?? `Bâtiment ${row.numero}`,
    typeBatiment: row.typeBatiment ?? 'LOGEMENTS',
    surfaceChauffee: row.surfaceChauffee ?? 0,
    volumeChauffe: row.volumeChauffe ?? 0,
    parc: row.parc ?? 1,
    etatInitial,
    etatReference,
  };
}

function mapEnergyType(dbType: string | null | undefined): string {
  const map: Record<string, string> = {
    FUEL: 'Fuel',
    GAZ_NATUREL: 'Gaz naturel',
    GAZ_PROPANE: 'Gaz propane',
    ELECTRICITE: 'Electricité',
    BOIS_DECHIQUETTE: 'Plaquette',
    BOIS_GRANULES: 'Granulé',
  };
  return map[dbType || ''] || dbType || 'Fuel';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const affaireId = params.id;

  try {
    // Load affaire with all relations
    const affaire = await db.affaire.findUnique({
      where: { id: affaireId },
      include: {
        batiments: true,
        parcs: {
          include: {
            chiffrageRef: true,
            chiffrageBio: true,
          },
        },
      },
    });

    if (!affaire) {
      return NextResponse.json({ error: 'Affaire non trouvée' }, { status: 404 });
    }

    const DJU = affaire.djuRetenu || 1977;
    const tempInt = affaire.tempIntBase || 19;
    const tempExt = affaire.tempExtBase || -7;
    const dureeEmprunt = affaire.dureeEmprunt || 15;
    const tauxAugFossile = affaire.augmentationFossile || 0.04;
    const tauxAugBiomasse = affaire.augmentationBiomasse || 0.02;

    // Transform DB rows to calculation types
    const batimentsCalc = affaire.batiments.map(transformBatiment);

    // Calculate per building
    const batimentsResults = batimentsCalc.map(bat => {
      const calculs = calculsBatimentComplet(bat, DJU, tempInt, tempExt);
      const surface = bat.surfaceChauffee || 1;
      const consoKwhepPerM2 = calculs.consoKWhepEI / surface;
      const etiquetteDpe = calculEtiquetteEnergetique(consoKwhepPerM2);

      return {
        numero: bat.numero,
        designation: bat.designation,
        parc: bat.parc,
        rendement_moyen: calculs.rendementMoyenEI,
        conso_kwhep: calculs.consoKWhepEI,
        conso_pcs: calculs.consoPCSEI,
        cout_annuel: calculs.coutAnnuelEI,
        conso_ref_calculees: calculs.consoRefCalculees || 0,
        conso_ref_pcs: calculs.consoRefPCS || 0,
        conso_sortie_chaudieres_ref: calculs.consoSortieChaudieresRef || 0,
        cout_annuel_ref: calculs.coutAnnuelRef || 0,
        conso_kwhep_per_m2: consoKwhepPerM2,
        etiquette_dpe: etiquetteDpe,
        surface_chauffee: surface,
      };
    });

    // Unique parcs
    const parcNums = [...new Set(batimentsCalc.map(b => b.parc))].sort((a, b) => a - b);

    // Calculate per parc
    const parcAgregation: any[] = [];
    const chiffrageResults: any[] = [];

    let totalCoutActuel = 0;
    let totalCoutRef = 0;
    let totalCoutBiomasse = 0;
    let totalAnnuiteRef = 0;
    let totalAnnuiteBiomasse = 0;

    for (const parcNum of parcNums) {
      const puissance = calculPuissanceChauffageParc(batimentsCalc, parcNum);
      const conso = calculConsoSortieParcChaudieresRef(batimentsCalc, parcNum, DJU, tempInt, tempExt);

      // Costs
      const coutActuel = batimentsResults
        .filter(b => b.parc === parcNum)
        .reduce((s, b) => s + b.cout_annuel, 0);
      const coutRef = batimentsResults
        .filter(b => b.parc === parcNum)
        .reduce((s, b) => s + b.cout_annuel_ref, 0);

      // Chiffrage reference
      const parcConfig = affaire.parcs.find(p => p.numero === parcNum);
      const chiffrageRef = parcConfig?.chiffrageRef;
      const chiffrageBio = parcConfig?.chiffrageBio;

      let investHT = 0;
      let investTTC = 0;
      let annuiteRefParc = 0;

      if (chiffrageRef) {
        const rawLignes = JSON.parse(chiffrageRef.lignesChaufferie || '[]');
        // Normalize field names: prixUnitaire → pu, quantite → qte
        const lignesChaufferie = rawLignes.map((l: any) => ({
          qte: l.qte || l.quantite || 0,
          pu: l.pu || l.prixUnitaire || 0,
        }));
        const fraisAnnexes = {
          bureauControle: chiffrageRef.tauxBureauControle,
          maitriseOeuvre: chiffrageRef.tauxMaitriseOeuvre,
          fraisDivers: chiffrageRef.tauxFraisDivers,
          aleas: chiffrageRef.tauxAleas,
        };
        investHT = calculInvestissementHTRef(lignesChaufferie, fraisAnnexes);
        investTTC = calculInvestissementTTCRef(investHT);
        annuiteRefParc = calculAnnuiteRef(investHT, 0, dureeEmprunt);
      }

      // Biomasse calculations
      const pourcentageBois = parcConfig?.pourcentageCouvertureBois || 80;
      const rendementBois = parcConfig?.rendementChaudiereBois || 85;
      const rendementAppoint = parcConfig?.rendementChaudiere2 || 90;

      const consoSortieChaudiereBois = calculConsommationsSortieChaudiereBois(conso, pourcentageBois);
      const consoEntreeBois = calculConsommationsEntreeChaudiereBois(consoSortieChaudiereBois, rendementBois);
      const consoEntreeAppoint = calculConsommationsAppoint(conso, pourcentageBois, rendementAppoint);

      const aff = affaire as any;
      const tarifBois = aff.tarifBoisExploitation || 0.05316;
      const tarifAppoint = aff.tarifGazExploitation || aff.tarifFuelExploitation || 0.1502;
      const tarifElec = aff.tarifElecExploitation || 0.1788;

      const coutBois = consoEntreeBois * tarifBois;
      const coutAppoint = consoEntreeAppoint * tarifAppoint;
      const p2Bio = chiffrageBio?.montantP2 || 0;
      const coutElecSupp = (chiffrageBio?.consoElecSupplementaire || 0) * tarifElec;
      const coutBiomasse = coutBois + coutAppoint + p2Bio + coutElecSupp;

      // Biomass investment
      let investBioHT = 0;
      let subventionsBio = 0;
      let annuiteBiomasse = 0;
      if (chiffrageBio) {
        const sousTotalChaufBio =
          (chiffrageBio.vrd || 0) + (chiffrageBio.grosOeuvre || 0) +
          (chiffrageBio.charpenteCouverture || 0) + (chiffrageBio.processBois || 0) +
          (chiffrageBio.chaudiereAppoint || 0) + (chiffrageBio.hydrauliqueChaufferie || 0) +
          ((chiffrageBio.reseauChaleurQte || 0) * (chiffrageBio.reseauChaleurPU || 1)) +
          (chiffrageBio.sousStation || 0) + (chiffrageBio.installationReseau || 0) +
          (chiffrageBio.autresTravaux || 0);
        const fraisRateBio =
          (chiffrageBio.tauxBureauControle || 0) + (chiffrageBio.tauxMaitriseOeuvre || 0) +
          (chiffrageBio.tauxFraisDivers || 0) + (chiffrageBio.tauxAleas || 0);
        investBioHT = sousTotalChaufBio * (1 + fraisRateBio);
        const subRates =
          (chiffrageBio.tauxSubventionCotEnr || 0) + (chiffrageBio.tauxAideDepartementale || 0) +
          (chiffrageBio.tauxDetrDsil || 0) + (chiffrageBio.subventionComplementaire || 0);
        const subBrut = investBioHT * (subRates / 100);
        subventionsBio = Math.min(subBrut, investBioHT * 0.80);
        const investBioNet = investBioHT - subventionsBio;
        annuiteBiomasse = investBioNet / dureeEmprunt;
      }

      totalCoutActuel += coutActuel;
      totalCoutRef += coutRef;
      totalCoutBiomasse += coutBiomasse;
      totalAnnuiteRef += annuiteRefParc;
      totalAnnuiteBiomasse += annuiteBiomasse;

      parcAgregation.push({
        parc: parcNum,
        puissance_kW: puissance,
        conso_kWh: conso,
        cout_total: coutRef,
        cout_biomasse: coutBiomasse,
      });

      chiffrageResults.push({
        parc: parcNum,
        sous_total_chaufferie: investHT,
        frais_annexes: investHT > 0 ? investTTC - investHT * 1.0 : 0,
        investissement_ht: investHT,
        tva: investTTC - investHT,
        investissement_ttc: investTTC,
        annuite: annuiteRefParc,
        investissement_bio_ht: investBioHT,
        subventions_bio: subventionsBio,
        annuite_biomasse: annuiteBiomasse,
      });
    }

    // Bilan 20 ans with real values
    const bilanActualize = calculBilan20Ans(
      totalCoutActuel,
      totalCoutRef + totalAnnuiteRef,
      totalCoutBiomasse + totalAnnuiteBiomasse,
      tauxAugFossile,
      tauxAugBiomasse,
      totalAnnuiteRef,
      totalAnnuiteBiomasse,
      dureeEmprunt
    );

    const economiesAn1 = bilanActualize.length > 0 ? bilanActualize[0].economie : 0;

    return NextResponse.json({
      affaire: {
        id: affaire.id,
        nomClient: affaire.nomClient,
        ville: affaire.ville,
        departement: affaire.departement,
      },
      batiments: batimentsResults,
      parcAgregation,
      chiffrage: chiffrageResults,
      bilanActualize: bilanActualize.map(year => ({
        annee: year.year,
        cout_initial: year.coutActuel,
        cout_reference: year.coutRef,
        cout_biomasse: year.coutBiomasse,
        economies_bio_vs_ref: year.economie,
        economies_an_1: economiesAn1,
      })),
    });
  } catch (error) {
    console.error('Erreur calculs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul' },
      { status: 500 }
    );
  }
}
