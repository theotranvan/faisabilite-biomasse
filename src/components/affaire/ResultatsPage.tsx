'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  calculsBatimentComplet,
  calculConsoSortieParcChaudieresRef,
  calculPuissanceChauffageParc,
  calculInvestissementHTRef,
  calculInvestissementTTCRef,
  calculAnnuiteRef,
  calculBilan20Ans,
  EMISSION_FACTORS,
  calculCO2Emissions,
  calculSO2Emissions,
} from '@/lib/calculs';
import type { Batiment, ChiffrageParcRef } from '@/lib/calculs/types';

interface ResultatsProps {
  affaireId: string;
  batiments?: Batiment[];
  chiffrage?: ChiffrageParcRef;
}

export function ResultatsPage({ affaireId, batiments = [], chiffrage }: ResultatsProps) {
  const [bilanData, setBilanData] = useState<any>(null);
  const [comparativeData, setComparativeData] = useState<any>(null);
  const [projections, setProjections] = useState<any[]>([]);
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

        // Get affaire data to determine which park we're working with
        const response = await fetch(`/api/affaires/${affaireId}`);
        if (!response.ok) throw new Error('Impossible de charger l\'affaire');
        const affaire = await response.json();

        // Get metrological parameters (DJU, tempInt, tempExt)
        const DJU = affaire.DJU || 1977;
        const tempInt = affaire.temperatureInterieure || 19;
        const tempExt = affaire.temperatureExterieure || -7;
        const dureeEmprunt = affaire.dureeEmprunt || 15;
        const tauxAugmentationFossile = affaire.tauxAugmentationFossile || 0.04;
        const tauxAugmentationBiomasse = affaire.tauxAugmentationBiomasse || 0.02;

        // Calculate complete results for each building
        const calculsBatiments = batiments.map(bat => ({
          ...bat,
          calculs: calculsBatimentComplet(bat, DJU, tempInt, tempExt),
        }));

        // Aggregate by park if multiple parks exist
        const parcs = [...new Set(batiments.map(b => b.parc))];
        
        // For now, focus on the first or primary park
        const primaryPay = parcs[0] || 1;
        const batsInPay = calculsBatiments.filter(b => b.parc === primaryPay);

        // Calculate aggregated results for park
        const puissanceParc = calculPuissanceChauffageParc(batsInPay, primaryPay);
        const consoParc = calculConsoSortieParcChaudieresRef(batsInPay, primaryPay, DJU, tempInt, tempExt);

        // Sum initial state costs
        const coutInitialActuel = batsInPay.reduce(
          (sum, b) => sum + (b.calculs?.coutAnnuelEI || 0),
          0
        );

        // Sum reference state costs
        const coutInitialRef = batsInPay.reduce(
          (sum, b) => sum + (b.calculs?.coutAnnuelRef || 0),
          0
        );

        // Calculate investment
        const investissementHT = chiffrage
          ? calculInvestissementHTRef(chiffrage.travauxChaufferie, chiffrage.fraisAnnexes)
          : 0;
        const investissementTTC = calculInvestissementTTCRef(investissementHT);
        const annuiteRef = calculAnnuiteRef(investissementHT, chiffrage?.emprunt_ref, dureeEmprunt);

        // Calculate initial biomass cost (sum of all building initial costs for reference)
        const coutInitialBiomasse = coutInitialRef;

        // Calculate 20-year balance
        const bilan20ans = calculBilan20Ans(
          coutInitialActuel,
          coutInitialRef,
          coutInitialBiomasse,
          tauxAugmentationFossile,
          tauxAugmentationBiomasse,
          annuiteRef,
          0, // Biomass doesn't have additional annuity in this model
          dureeEmprunt
        );

        // Calculate environmental impact
        // Use estimated consumption based on reference state
        const co2Factor = 0.314; // Fuel factor
        const so2Factor = 0.00074; // Fuel factor
        const emissionsCO2Totales = bilan20ans.reduce(
          (sum, year) => sum + calculCO2Emissions(year.coutRef * 100, co2Factor), // Rough estimate
          0
        );
        const totalEconomies = bilan20ans[19]?.economie || 0;
        const delaiRetourInvestissement = totalEconomies > 0
          ? Math.round((investissementHT / (totalEconomies / 20)) * 10) / 10
          : 0;

        setBilanData({
          investissementHT,
          investissementTTC,
          annuiteRef,
          delaiRetourInv: delaiRetourInvestissement,
          economies20ans: totalEconomies,
          emissionsCO2Evitees: Math.round(emissionsCO2Totales / 1000),
        });

        setComparativeData({
          puissance: puissanceParc,
          conso: consoParc,
          batiments: batsInPay.map(b => ({
            numero: b.numero,
            designation: b.designation,
            consoEI: b.calculs?.coutAnnuelEI || 0,
            consoRef: b.calculs?.coutAnnuelRef || 0,
            consoSortie: b.calculs?.consoSortieChaudieresRef || 0,
          })),
        });

        setProjections(
          bilan20ans.map(year => ({
            year: year.year,
            coutActuel: year.coutActuel,
            coutRef: year.coutRef,
            coutBiomasse: year.coutBiomasse,
            economie: year.economie,
          }))
        );

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du calcul des résultats');
        setIsLoading(false);
      }
    };

    calculateResults();
  }, [affaireId, batiments, chiffrage]);

  if (isLoading) {
    return <Alert type="info">Calcul des résultats en cours...</Alert>;
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Délai de retour sur investissement</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {bilanData?.delaiRetourInv.toFixed(1)} ans
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Investissement HT</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {(bilanData?.investissementHT / 1000).toFixed(0)}k€
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">CO₂ évitées (20 ans)</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {bilanData?.emissionsCO2Evitees} t
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Économies (20 ans)</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {(bilanData?.economies20ans / 1000).toFixed(0)}k€
          </div>
        </Card>
      </div>

      {/* Comparative Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Tableau comparatif État initial / Référence</h3>
        </CardHeader>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2">Bâtiment</th>
                <th className="text-right py-2 px-2">Coût EI (€/an)</th>
                <th className="text-right py-2 px-2">Coût Ref (€/an)</th>
                <th className="text-right py-2 px-2">Sortie Chaudière (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {comparativeData?.batiments?.map((bat: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 px-2">{bat.designation}</td>
                  <td className="text-right py-2 px-2">{bat.consoEI.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right py-2 px-2">{bat.consoRef.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right py-2 px-2">{bat.consoSortie.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
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
              <Line
                type="monotone"
                dataKey="coutActuel"
                stroke="#1f2937"
                name="État Initial"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="coutRef"
                stroke="#ef4444"
                name="Scénario Référence"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="coutBiomasse"
                stroke="#10b981"
                name="Scénario Biomasse"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Économies cumulées Chart */}
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

      {/* Financial Summary Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Résumé financier du projet</h3>
        </CardHeader>
        <div className="p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Investissement HT</td>
                <td className="py-2 font-semibold text-right">
                  {bilanData?.investissementHT.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Investissement TTC (20% TVA)</td>
                <td className="py-2 font-semibold text-right">
                  {bilanData?.investissementTTC.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Annuité (15 ans)</td>
                <td className="py-2 font-semibold text-right">
                  {bilanData?.annuiteRef.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
                </td>
              </tr>
              <tr className="border-b border-gray-200 bg-green-50">
                <td className="py-2 text-gray-600">Économies totales (20 ans)</td>
                <td className="py-2 font-semibold text-right text-green-600">
                  +{bilanData?.economies20ans.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 font-semibold text-gray-900">Délai de retour sur investissement</td>
                <td className="py-2 font-bold text-right text-blue-600">
                  {bilanData?.delaiRetourInv.toFixed(1)} ans
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Impact environnemental estimé (20 ans)</h3>
        </CardHeader>
        <div className="p-6 grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">CO₂ évitées</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{bilanData?.emissionsCO2Evitees}</div>
            <div className="text-xs text-gray-500 mt-1">tonnes</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Équivalent arbres</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {Math.round((bilanData?.emissionsCO2Evitees || 0) * 1.5)}
            </div>
            <div className="text-xs text-gray-500 mt-1">arbres plantés</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Puissance totale</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {comparativeData?.puissance.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">kW</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
