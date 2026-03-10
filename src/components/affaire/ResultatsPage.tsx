'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  calculsBatimentComplet,
  calculConsoSortieParcChaudieresRef,
  calculPuissanceChauffageParc,
  calculBilan20Ans,
  calculCO2Emissions,
  calculSO2Emissions,
  getEmissionFactor,
  calculConsommationsEntreeChaudiereBois,
  calculConsommationsSortieChaudiereBois,
  calculConsommationsAppoint,
  calculEtiquetteEnergetique,
  getEtiquetteCouleur,
} from '@/lib/calculs';
import type { Batiment } from '@/lib/calculs';

// Convert flat DB batiment to nested Batiment type expected by calculs
function dbBatimentToCalcBatiment(db: any): Batiment {
  return {
    numero: db.numero,
    designation: db.designation,
    typeBatiment: db.typeBatiment,
    surfaceChauffee: db.surfaceChauffee || 0,
    volumeChauffe: db.volumeChauffe || 0,
    parc: db.parc || 1,
    etatInitial: {
      deperditions_kW: db.deperditions || 0,
      rendementProduction: db.rendementProduction || 85,
      rendementDistribution: db.rendementDistribution || 95,
      rendementEmission: db.rendementEmission || 95,
      rendementRegulation: db.rendementRegulation || 90,
      coefIntermittence: db.coefIntermittence || 1,
      consommationsCalculees: db.consommationsCalculees || 0,
      consommationsReelles: db.consommationsReelles || 0,
      typeEnergie: db.typeEnergie || 'Fuel',
      tarification: db.tarification || 0,
      abonnement: db.abonnement || 0,
    },
    etatReference: (db.refDeperditions != null || db.refRendementProduction != null) ? {
      deperditions_kW: db.refDeperditions ?? db.deperditions ?? 0,
      rendementProduction: db.refRendementProduction ?? db.rendementProduction ?? 85,
      rendementDistribution: db.refRendementDistribution ?? db.rendementDistribution ?? 95,
      rendementEmission: db.refRendementEmission ?? db.rendementEmission ?? 95,
      rendementRegulation: db.refRendementRegulation ?? db.rendementRegulation ?? 90,
      coefIntermittence: db.coefIntermittence || 1,
      consommationsCalculees: db.consommationsCalculees || 0,
      consommationsReelles: db.consommationsReelles || 0,
      typeEnergie: db.refTypeEnergie ?? db.typeEnergie ?? 'Fuel',
      tarification: db.tarification || 0,
      abonnement: db.abonnement || 0,
    } : {
      // If no ref-specific fields, use initial values as reference
      deperditions_kW: db.deperditions || 0,
      rendementProduction: db.rendementProduction || 85,
      rendementDistribution: db.rendementDistribution || 95,
      rendementEmission: db.rendementEmission || 95,
      rendementRegulation: db.rendementRegulation || 90,
      coefIntermittence: db.coefIntermittence || 1,
      consommationsCalculees: db.consommationsCalculees || 0,
      consommationsReelles: db.consommationsReelles || 0,
      typeEnergie: db.typeEnergie || 'Fuel',
      tarification: db.tarification || 0,
      abonnement: db.abonnement || 0,
    },
  };
}

interface ResultatsProps {
  affaireId: string;
  batiments?: any[];
  chiffrage?: any;
}

const formatEur = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';

interface ParcResult {
  parcNum: number | 'consolide';
  puissance: number;
  conso: number;
  coutActuel: number;
  coutRef: number;
  coutBiomasse: number;
  annuiteRef: number;
  annuiteBiomasse: number;
  investHT: number;
  investBioHT: number;
  subventionsBio: number;
  coutBois: number;
  coutAppoint: number;
  coutElecSupp: number;
  p2Bio: number;
  consoEntreeBois: number;
  consoEntreeAppoint: number;
  co2Initial: number;
  co2Ref: number;
  co2Bio: number;
  so2Initial: number;
  so2Ref: number;
  so2Bio: number;
  batiments: Array<{
    numero: number;
    designation: string;
    surfaceChauffee: number;
    coutAnnuelEI: number;
    coutAnnuelRef: number;
    consoSortie: number;
    consoKWhepEI: number;
    dpe: string;
    dpeCouleur: string;
  }>;
}

export function ResultatsPage({ affaireId, batiments = [], chiffrage }: ResultatsProps) {
  const [allResults, setAllResults] = useState<Record<string, ParcResult>>({});
  const [selectedParc, setSelectedParc] = useState<string>('consolide');
  const [projections, setProjections] = useState<any[]>([]);
  const [monotoneChartData, setMonotoneChartData] = useState<any[]>([]);
  const [villeMonotone, setVilleMonotone] = useState('Bourges');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateResults = async () => {
      try {
        if (!batiments || batiments.length === 0) {
          setError('Aucun bâtiment disponible pour le calcul');
          setIsLoading(false);
          return;
        }

        // Fetch affaire data
        const response = await fetch(`/api/affaires/${affaireId}`);
        if (!response.ok) throw new Error('Impossible de charger l\'affaire');
        const affaire = await response.json();

        // Fetch chiffrage biomasse
        const resBio = await fetch(`/api/affaires/${affaireId}/chiffrage-biomasse`);
        const chiffrageBio = resBio.ok ? await resBio.json() : null;

        // Parameters
        const DJU = affaire.djuRetenu || 1977;
        const tempInt = affaire.tempIntBase || 19;
        const tempExt = affaire.tempExtBase || -7;
        const dureeEmprunt = affaire.dureeEmprunt || 15;
        const tauxAugFossile = affaire.augmentationFossile || 0.04;
        const tauxAugBiomasse = affaire.augmentationBiomasse || 0.02;

        // Convert flat DB batiments to calc-compatible nested format
        const calcBatiments = batiments.map(dbBatimentToCalcBatiment);

        // Calculate per building
        const calculsBatiments = calcBatiments.map(bat => ({
          ...bat,
          calculs: calculsBatimentComplet(bat, DJU, tempInt, tempExt),
        }));

        // Unique parcs
        const parcs = [...new Set(calcBatiments.map(b => b.parc))].sort((a, b) => a - b);

        // Calculate per parc
        const results: Record<string, ParcResult> = {};

        for (const parcNum of parcs) {
          const batsInParc = calculsBatiments.filter(b => b.parc === parcNum);
          const puissance = calculPuissanceChauffageParc(batsInParc, parcNum);
          const conso = calculConsoSortieParcChaudieresRef(batsInParc, parcNum, DJU, tempInt, tempExt);
          const coutActuel = batsInParc.reduce((s, b) => s + (b.calculs?.coutAnnuelEI || 0), 0);
          const coutRef = batsInParc.reduce((s, b) => s + (b.calculs?.coutAnnuelRef || 0), 0);

          // Investment ref — compute from flat DB chiffrage object
          let investHT = 0;
          let annuiteRefParc = 0;
          if (chiffrage) {
            // Parse lignesChaufferie JSON string → compute sous-total
            let lignes: any[] = [];
            try {
              lignes = typeof chiffrage.lignesChaufferie === 'string'
                ? JSON.parse(chiffrage.lignesChaufferie)
                : (chiffrage.lignesChaufferie || []);
            } catch { lignes = []; }
            const sousTotalChaufferie = Array.isArray(lignes)
              ? lignes.reduce((s: number, l: any) => s + ((l.qte || 0) * (l.prixUnitaire || l.pu || 0)), 0)
              : 0;
            const feeRate = ((chiffrage.tauxBureauControle || 0) + (chiffrage.tauxMaitriseOeuvre || 0) +
              (chiffrage.tauxFraisDivers || 0) + (chiffrage.tauxAleas || 0)) / 100;
            investHT = sousTotalChaufferie * (1 + feeRate);
            annuiteRefParc = investHT / dureeEmprunt;
          }

          // Parc config
          const parcConfig = affaire.parcs?.find((p: any) => p.numero === parcNum);
          const pourcentageBois = parcConfig?.pourcentageCouvertureBois || 80;
          const rendementBois = parcConfig?.rendementChaudiereBois || 85;
          const rendementAppoint = parcConfig?.rendementChaudiere2 || 90;

          // Biomass consumption
          const consoSortieChaudiereBois = calculConsommationsSortieChaudiereBois(conso, pourcentageBois);
          const consoEntreeBois = calculConsommationsEntreeChaudiereBois(consoSortieChaudiereBois, rendementBois);
          const consoEntreeAppoint = calculConsommationsAppoint(conso, pourcentageBois, rendementAppoint);

          // Tarifs
          const tarifBois = affaire.tarifBoisExploitation || 0.05316;
          const tarifAppoint = affaire.tarifGazExploitation || affaire.tarifFuelExploitation || 0.1502;
          const tarifElec = affaire.tarifElecExploitation || 0.1788;

          // Biomass annual costs
          const coutBois = consoEntreeBois * tarifBois;
          const coutAppoint = consoEntreeAppoint * tarifAppoint;
          const p2Bio = chiffrageBio?.montantP2 || chiffrageBio?.p2 || 0;
          const coutElecSupp = (chiffrageBio?.consoElecSupplementaire || chiffrageBio?.consoElecSupplement || 0) * tarifElec;
          const coutBiomasse = coutBois + coutAppoint + p2Bio + coutElecSupp;

          // Biomass investment & annuity
          let investBioHT = 0;
          let subventionsBio = 0;
          let annuiteBiomasse = 0;
          if (chiffrageBio) {
            const reseauChaleurTotal = (chiffrageBio.reseauChaleurQte || chiffrageBio.reseauChaleur || 0) * (chiffrageBio.reseauChaleurPU || 1);
            const sousTotalChaufBio =
              (chiffrageBio.vrd || 0) + (chiffrageBio.grosOeuvre || 0) +
              (chiffrageBio.charpenteCouverture || chiffrageBio.charpente || 0) + (chiffrageBio.processBois || 0) +
              (chiffrageBio.chaudiereAppoint || chiffrageBio.chaudierAppoint || 0) + (chiffrageBio.hydrauliqueChaufferie || chiffrageBio.hydraulique || 0) +
              reseauChaleurTotal + (chiffrageBio.sousStation || 0) +
              (chiffrageBio.installationReseau || chiffrageBio.installationReseauBat || 0) + (chiffrageBio.autresTravaux || chiffrageBio.autreTravaux || 0);
            const fraisRateBio =
              ((chiffrageBio.tauxBureauControle || chiffrageBio.bureauControle || 0) +
              (chiffrageBio.tauxMaitriseOeuvre || chiffrageBio.maitriseOeuvre || 0) +
              (chiffrageBio.tauxFraisDivers || chiffrageBio.fraisDivers || 0) +
              (chiffrageBio.tauxAleas || chiffrageBio.aleas || 0)) / 100;
            investBioHT = sousTotalChaufBio * (1 + fraisRateBio);
            const subRates =
              (chiffrageBio.tauxSubventionCotEnr || chiffrageBio.cotEnr || 0) +
              (chiffrageBio.tauxAideDepartementale || chiffrageBio.aideDepartementale || 0) +
              (chiffrageBio.tauxDetrDsil || chiffrageBio.detrDsil || 0);
            const subComplement = chiffrageBio.subventionComplementaire || 0;
            const subBrut = investBioHT * (subRates / 100) + subComplement;
            subventionsBio = Math.min(subBrut, investBioHT * 0.80);
            const investBioNet = investBioHT - subventionsBio;
            annuiteBiomasse = investBioNet / dureeEmprunt;
          }

          // CO2/SO2 — real calculations by fuel type
          const fuelTypeInitial = batsInParc[0]?.etatInitial.typeEnergie || 'Fuel';
          const fuelTypeRef = batsInParc[0]?.etatReference?.typeEnergie || 'Gaz naturel';
          const fuelTypeBiomasse = parcConfig?.typeBiomasse === 'GRANULES' ? 'Granulé' : 'Plaquette';
          const consoInitialeKwh = batsInParc.reduce((s, b) => s + (b.etatInitial.consommationsCalculees || b.etatInitial.consommationsReelles || 0), 0);
          const consoRefKwh = batsInParc.reduce((s, b) => s + (b.calculs?.consoRefCalculees || 0), 0);

          const co2Initial = calculCO2Emissions(consoInitialeKwh, getEmissionFactor(fuelTypeInitial, 'co2'));
          const co2Ref = calculCO2Emissions(consoRefKwh, getEmissionFactor(fuelTypeRef, 'co2'));
          const co2Bio = calculCO2Emissions(consoEntreeBois, getEmissionFactor(fuelTypeBiomasse, 'co2'));
          const so2Initial = calculSO2Emissions(consoInitialeKwh, getEmissionFactor(fuelTypeInitial, 'so2'));
          const so2Ref = calculSO2Emissions(consoRefKwh, getEmissionFactor(fuelTypeRef, 'so2'));
          const so2Bio = calculSO2Emissions(consoEntreeBois, getEmissionFactor(fuelTypeBiomasse, 'so2'));

          // DPE per building
          const batimentDetails = batsInParc.map(b => {
            const consoKWhepEI = b.calculs?.consoKWhepEI || 0;
            const surface = b.surfaceChauffee || 1;
            const dpe = calculEtiquetteEnergetique(consoKWhepEI / surface);
            return {
              numero: b.numero,
              designation: b.designation,
              surfaceChauffee: surface,
              coutAnnuelEI: b.calculs?.coutAnnuelEI || 0,
              coutAnnuelRef: b.calculs?.coutAnnuelRef || 0,
              consoSortie: b.calculs?.consoSortieChaudieresRef || 0,
              consoKWhepEI,
              dpe,
              dpeCouleur: getEtiquetteCouleur(dpe),
            };
          });

          results[`parc${parcNum}`] = {
            parcNum,
            puissance,
            conso,
            coutActuel,
            coutRef,
            coutBiomasse,
            annuiteRef: annuiteRefParc,
            annuiteBiomasse,
            investHT,
            investBioHT,
            subventionsBio,
            coutBois,
            coutAppoint,
            coutElecSupp,
            p2Bio,
            consoEntreeBois,
            consoEntreeAppoint,
            co2Initial,
            co2Ref,
            co2Bio,
            so2Initial,
            so2Ref,
            so2Bio,
            batiments: batimentDetails,
          };
        }

        // Consolidated — sum all parcs
        const allParcKeys = Object.keys(results);
        const consolide: ParcResult = {
          parcNum: 'consolide',
          puissance: 0, conso: 0, coutActuel: 0, coutRef: 0, coutBiomasse: 0,
          annuiteRef: 0, annuiteBiomasse: 0, investHT: 0, investBioHT: 0,
          subventionsBio: 0, coutBois: 0, coutAppoint: 0, coutElecSupp: 0, p2Bio: 0,
          consoEntreeBois: 0, consoEntreeAppoint: 0,
          co2Initial: 0, co2Ref: 0, co2Bio: 0, so2Initial: 0, so2Ref: 0, so2Bio: 0,
          batiments: [],
        };
        for (const key of allParcKeys) {
          const r = results[key];
          consolide.puissance += r.puissance;
          consolide.conso += r.conso;
          consolide.coutActuel += r.coutActuel;
          consolide.coutRef += r.coutRef;
          consolide.coutBiomasse += r.coutBiomasse;
          consolide.annuiteRef += r.annuiteRef;
          consolide.annuiteBiomasse += r.annuiteBiomasse;
          consolide.investHT += r.investHT;
          consolide.investBioHT += r.investBioHT;
          consolide.subventionsBio += r.subventionsBio;
          consolide.coutBois += r.coutBois;
          consolide.coutAppoint += r.coutAppoint;
          consolide.coutElecSupp += r.coutElecSupp;
          consolide.p2Bio += r.p2Bio;
          consolide.consoEntreeBois += r.consoEntreeBois;
          consolide.consoEntreeAppoint += r.consoEntreeAppoint;
          consolide.co2Initial += r.co2Initial;
          consolide.co2Ref += r.co2Ref;
          consolide.co2Bio += r.co2Bio;
          consolide.so2Initial += r.so2Initial;
          consolide.so2Ref += r.so2Ref;
          consolide.so2Bio += r.so2Bio;
          consolide.batiments.push(...r.batiments);
        }
        results['consolide'] = consolide;

        // Use consolidated for bilan 20 ans and projections
        const sel = consolide;

        // Bilan 20 ans
        const bilan20ans = calculBilan20Ans(
          sel.coutActuel, sel.coutRef, sel.coutBiomasse,
          tauxAugFossile, tauxAugBiomasse,
          sel.annuiteRef, sel.annuiteBiomasse, dureeEmprunt
        );

        setAllResults(results);
        setSelectedParc(parcs.length === 1 ? `parc${parcs[0]}` : 'consolide');

        setProjections(
          bilan20ans.map((year: any) => ({
            year: year.year,
            coutActuel: year.coutActuel,
            coutRef: year.coutRef,
            coutBiomasse: year.coutBiomasse,
            economie: year.economie,
          }))
        );

        // Monotone de charge
        const villeM = affaire.villeMonotone || 'Bourges';
        setVilleMonotone(villeM);
        try {
          const resMono = await fetch(`/api/meteo/monotone/${villeM}`);
          if (resMono.ok) {
            const temperatures = await resMono.json();
            if (Array.isArray(temperatures) && temperatures.length > 0) {
              const depParDegre = (sel.puissance * 1000) / (tempInt - tempExt);
              const puissanceGenBase = affaire.parcs?.[0]?.puissanceChaudiereBois || 0;
              const points = temperatures
                .map((t: number) => Math.max(0, depParDegre * (tempInt - t)))
                .filter((p: number) => p > 0)
                .sort((a: number, b: number) => b - a)
                .map((p: number, i: number) => ({
                  heure: i,
                  puissance: p / 1000,
                  generateur: puissanceGenBase,
                }));
              setMonotoneChartData(points);
            }
          }
        } catch { /* monotone optionnelle */ }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du calcul des résultats');
        setIsLoading(false);
      }
    };

    calculateResults();
  }, [affaireId, batiments, chiffrage]);

  if (isLoading) return <Alert type="info">Calcul des résultats en cours...</Alert>;
  if (error) return <Alert type="error">{error}</Alert>;

  const sel = allResults[selectedParc] || allResults['consolide'];
  if (!sel) return <Alert type="error">Aucun résultat disponible</Alert>;

  const parcKeys = Object.keys(allResults).filter(k => k !== 'consolide');
  const gainCO2annuel = sel.co2Ref - sel.co2Bio;
  const gainCO2_20ans = gainCO2annuel * 20;
  const gainSO2annuel = sel.so2Ref - sel.so2Bio;

  // Synthèse values
  const p1Biomasse = sel.coutBois + sel.coutAppoint + sel.coutElecSupp;
  const totalExploitActuel = sel.coutActuel;
  const totalExploitRef = sel.coutRef;
  const totalExploitBio = sel.coutBiomasse;
  const chargeMOBio = sel.investBioHT - sel.subventionsBio;
  const coutGlobalRef = sel.coutRef + sel.annuiteRef;
  const coutGlobalBio = sel.coutBiomasse + sel.annuiteBiomasse;
  const gainExploitation = coutGlobalRef - coutGlobalBio;
  const surcout = sel.investBioHT - sel.investHT;
  const tempsRetour = gainExploitation > 0 ? surcout / gainExploitation : 0;
  const economies20ans = projections.reduce((s, y) => s + y.economie, 0);

  return (
    <div className="space-y-6">

      {/* Park selector (if multiple parks) */}
      {parcKeys.length > 1 && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Vue :</span>
          {parcKeys.map(key => (
            <button
              key={key}
              onClick={() => setSelectedParc(key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedParc === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Parc {allResults[key].parcNum}
            </button>
          ))}
          <button
            onClick={() => setSelectedParc('consolide')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedParc === 'consolide'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Consolidé
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Temps de retour</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {tempsRetour > 0 ? tempsRetour.toFixed(1) : '—'} ans
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Investissement biomasse HT</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {sel.investBioHT > 0 ? `${(sel.investBioHT / 1000).toFixed(0)}k€` : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">CO₂ évitées (20 ans)</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {gainCO2_20ans.toFixed(1)} t
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Gain annuel exploitation</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {gainExploitation > 0 ? formatEur(gainExploitation) : '—'}
          </div>
        </Card>
      </div>

      {/* Comparative Table with DPE */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Tableau comparatif par bâtiment</h3>
        </CardHeader>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2">Bâtiment</th>
                <th className="text-right py-2 px-2">Surface (m²)</th>
                <th className="text-right py-2 px-2">Coût EI (€/an)</th>
                <th className="text-right py-2 px-2">Coût Ref (€/an)</th>
                <th className="text-right py-2 px-2">Sortie Chaud. (kWh)</th>
                <th className="text-center py-2 px-2">DPE</th>
              </tr>
            </thead>
            <tbody>
              {sel.batiments.map((bat, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 px-2">{bat.designation}</td>
                  <td className="text-right py-2 px-2">{bat.surfaceChauffee.toLocaleString('fr-FR')}</td>
                  <td className="text-right py-2 px-2">{bat.coutAnnuelEI.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right py-2 px-2">{bat.coutAnnuelRef.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right py-2 px-2">{bat.consoSortie.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-center py-2 px-2">
                    <span
                      className="inline-block w-8 h-8 rounded text-white font-bold text-lg leading-8"
                      style={{ backgroundColor: bat.dpeCouleur }}
                    >
                      {bat.dpe}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Synthèse comparative 3 colonnes */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Synthèse comparative des solutions</h3>
        </CardHeader>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-3">Poste</th>
                <th className="text-right py-2 px-3 bg-gray-50">Situation Actuelle<br/><span className="text-xs text-gray-500">€ TTC</span></th>
                <th className="text-right py-2 px-3 bg-blue-50">Situation Référence<br/><span className="text-xs text-gray-500">€ TTC</span></th>
                <th className="text-right py-2 px-3 bg-green-50">Situation Biomasse<br/><span className="text-xs text-gray-500">€ TTC</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">Combustible</td>
                <td className="text-right px-3 bg-gray-50">{formatEur(sel.coutActuel)}</td>
                <td className="text-right px-3 bg-blue-50">{formatEur(sel.coutRef)}</td>
                <td className="text-right px-3 bg-green-50">{formatEur(sel.coutBois + sel.coutAppoint)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Conso élec supplémentaire</td>
                <td className="text-right px-3 bg-gray-50">-</td>
                <td className="text-right px-3 bg-blue-50">-</td>
                <td className="text-right px-3 bg-green-50">{formatEur(sel.coutElecSupp)}</td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2 px-3">Montant P1 (combustible)</td>
                <td className="text-right px-3 bg-gray-50">{formatEur(sel.coutActuel)}</td>
                <td className="text-right px-3 bg-blue-50">{formatEur(sel.coutRef)}</td>
                <td className="text-right px-3 bg-green-50">{formatEur(p1Biomasse)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Montant P2 (entretien)</td>
                <td className="text-right px-3 bg-gray-50">-</td>
                <td className="text-right px-3 bg-blue-50">-</td>
                <td className="text-right px-3 bg-green-50">{formatEur(sel.p2Bio)}</td>
              </tr>
              <tr className="border-b-2 font-bold">
                <td className="py-2 px-3">Total exploitation</td>
                <td className="text-right px-3 bg-gray-50">{formatEur(totalExploitActuel)}</td>
                <td className="text-right px-3 bg-blue-50">{formatEur(totalExploitRef)}</td>
                <td className="text-right px-3 bg-green-50">{formatEur(totalExploitBio)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Investissement HT</td>
                <td className="text-right px-3 bg-gray-50">-</td>
                <td className="text-right px-3 bg-blue-50">{formatEur(sel.investHT)}</td>
                <td className="text-right px-3 bg-green-50">{formatEur(sel.investBioHT)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Subventions</td>
                <td className="text-right px-3 bg-gray-50">-</td>
                <td className="text-right px-3 bg-blue-50">0 €</td>
                <td className="text-right px-3 bg-green-50 text-green-600">-{formatEur(sel.subventionsBio)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Charge maître d&apos;ouvrage</td>
                <td className="text-right px-3 bg-gray-50">-</td>
                <td className="text-right px-3 bg-blue-50">{formatEur(sel.investHT)}</td>
                <td className="text-right px-3 bg-green-50">{formatEur(chargeMOBio)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Annuité emprunt ({sel.annuiteRef > 0 || sel.annuiteBiomasse > 0 ? `${allResults['consolide'] ? '' : ''}` : ''}{Math.round(sel.annuiteRef > 0 ? sel.investHT / sel.annuiteRef : 15)} ans)</td>
                <td className="text-right px-3 bg-gray-50">-</td>
                <td className="text-right px-3 bg-blue-50">{formatEur(sel.annuiteRef)}</td>
                <td className="text-right px-3 bg-green-50">{formatEur(sel.annuiteBiomasse)}</td>
              </tr>
              <tr className="border-b-2 font-bold bg-blue-50">
                <td className="py-2 px-3">Coût global annuel</td>
                <td className="text-right px-3">{formatEur(sel.coutActuel)}</td>
                <td className="text-right px-3">{formatEur(coutGlobalRef)}</td>
                <td className="text-right px-3">{formatEur(coutGlobalBio)}</td>
              </tr>
              <tr className="bg-green-50 font-bold">
                <td className="py-2 px-3">Gain sur coût d&apos;exploitation</td>
                <td colSpan={2}></td>
                <td className="text-right px-3 text-green-700">{formatEur(gainExploitation)}</td>
              </tr>
              <tr className="bg-yellow-50 font-bold">
                <td className="py-2 px-3">Temps de retour</td>
                <td colSpan={2}></td>
                <td className="text-right px-3">{tempsRetour > 0 ? `${tempsRetour.toFixed(1)} ans` : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* CO2/SO2 Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Bilan des émissions CO₂ et SO₂</h3>
        </CardHeader>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-3">Émissions</th>
                <th className="text-right py-2 px-3">Actuelle</th>
                <th className="text-right py-2 px-3">Référence</th>
                <th className="text-right py-2 px-3">Biomasse</th>
                <th className="text-right py-2 px-3">Gain</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">CO₂ (t/an)</td>
                <td className="text-right px-3">{sel.co2Initial.toFixed(2)}</td>
                <td className="text-right px-3">{sel.co2Ref.toFixed(2)}</td>
                <td className="text-right px-3">{sel.co2Bio.toFixed(2)}</td>
                <td className="text-right px-3 font-bold text-green-600">{gainCO2annuel.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">SO₂ (t/an)</td>
                <td className="text-right px-3">{sel.so2Initial.toFixed(4)}</td>
                <td className="text-right px-3">{sel.so2Ref.toFixed(4)}</td>
                <td className="text-right px-3">{sel.so2Bio.toFixed(4)}</td>
                <td className="text-right px-3 font-bold text-green-600">{gainSO2annuel.toFixed(4)}</td>
              </tr>
              <tr className="bg-green-50">
                <td className="py-2 px-3 font-bold">CO₂ évitées sur 20 ans</td>
                <td colSpan={3}></td>
                <td className="text-right px-3 font-bold text-green-600">{gainCO2_20ans.toFixed(1)} t</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Projection Chart - 3 curves */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Projection financière 20 ans (3 scénarios)</h3>
        </CardHeader>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Années', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Coût annuel (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => `${(value / 1000).toFixed(1)}k€`}
                labelFormatter={(label) => `Année ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="coutActuel" stroke="#1f2937" name="État Initial" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="coutRef" stroke="#ef4444" name="Scénario Référence" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="coutBiomasse" stroke="#10b981" name="Scénario Biomasse" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Économies cumulées */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Économies cumulées (Référence - Biomasse)</h3>
        </CardHeader>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Années', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Économies (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: any) => `${(value / 1000).toFixed(1)}k€`} />
              <Bar dataKey="economie" fill="#10b981" name="Économies annuelles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monotone de charge */}
      {monotoneChartData.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Monotone de charge</h3>
            <p className="text-sm text-gray-600 mt-1">Puissance appelée triée sur l&apos;année — ville : {villeMonotone}</p>
          </CardHeader>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monotoneChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="heure" label={{ value: 'Heures', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Puissance (kW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} kW`} />
                <Legend />
                <Line type="monotone" dataKey="puissance" stroke="#ef4444" name="Puissance appelée" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="generateur" stroke="#10b981" name="Générateur base" dot={false} strokeWidth={2} strokeDasharray="8 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Résumé financier du projet</h3>
        </CardHeader>
        <div className="p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Investissement HT Référence</td>
                <td className="py-2 font-semibold text-right">{formatEur(sel.investHT)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Investissement HT Biomasse</td>
                <td className="py-2 font-semibold text-right">{formatEur(sel.investBioHT)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Subventions biomasse</td>
                <td className="py-2 font-semibold text-right text-green-600">-{formatEur(sel.subventionsBio)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Annuité référence</td>
                <td className="py-2 font-semibold text-right">{formatEur(sel.annuiteRef)} /an</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Annuité biomasse</td>
                <td className="py-2 font-semibold text-right">{formatEur(sel.annuiteBiomasse)} /an</td>
              </tr>
              <tr className="border-b border-gray-200 bg-green-50">
                <td className="py-2 text-gray-600">Économies totales (20 ans)</td>
                <td className="py-2 font-semibold text-right text-green-600">+{formatEur(economies20ans)}</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 font-semibold text-gray-900">Temps de retour sur investissement</td>
                <td className="py-2 font-bold text-right text-blue-600">
                  {tempsRetour > 0 ? `${tempsRetour.toFixed(1)} ans` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
