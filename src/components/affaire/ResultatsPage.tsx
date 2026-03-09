'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResultatsProps {
  affaireId: string;
  data?: any;
}

export function ResultatsPage({ data: initialData }: ResultatsProps) {
  const [projections, setProjections] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [environmentalImpact, setEnvironmentalImpact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate calculation results for demo
    if (initialData) {
      // Generate 20-year projections
      const proj = [];
      let cumulativeSavings = 0;
      for (let year = 0; year <= 20; year++) {
        const annualSavings = (initialData.batiments?.length || 1) * 8000; // Simplifié
        cumulativeSavings += annualSavings;
        proj.push({
          year,
          annualCosts: 60000 + year * 1000,
          annualProduction: 350000 - year * 1500,
          cumulativeSavings,
        });
      }
      setProjections(proj);

      // Financial summary
      setFinancialSummary({
        investissementInitial: 250000,
        coutsMaintenance20ans: 180000,
        economiesEnergie20ans: 450000,
        surPlus: 450000 - 180000 - 250000,
        delaiRetourInv: 7.2,
        tauRoi: 18.5,
      });

      // Environmental impact
      setEnvironmentalImpact({
        emissionsCo2Evitees: 4500,
        equivalentArbres: 7500,
        energieRenouvelable: 85,
      });

      setIsLoading(false);
    }
  }, [initialData]);

  if (isLoading) {
    return <Alert type="info">Calcul des résultats en cours...</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Délai de retour sur investissement</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{financialSummary?.delaiRetourInv} ans</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Taux de ROI</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{financialSummary?.tauRoi}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">CO₂ évitées</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{environmentalImpact?.emissionsCo2Evitees} t</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Surplus 20 ans</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {(financialSummary?.surPlus / 1000).toFixed(0)}k€
          </div>
        </Card>
      </div>

      {/* Financial Projection Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Projection financière 20 ans</h3>
        </CardHeader>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Années', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Épargne cumulée (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: any) => `${(value / 1000).toFixed(1)}k€`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativeSavings"
                stroke="#10b981"
                name="Épargne cumulée"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Annual Comparison Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Comparaison annuelle</h3>
        </CardHeader>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projections.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Années', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Montant (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: any) => `${(value / 1000).toFixed(1)}k€`} />
              <Legend />
              <Bar dataKey="annualCosts" fill="#ef4444" name="Coûts annuels" />
              <Bar dataKey="annualProduction" fill="#3b82f6" name="Production MWh" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Financial Summary Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Résumé financier sur 20 ans</h3>
        </CardHeader>
        <div className="p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Investissement initial</td>
                <td className="py-2 font-semibold text-right">{financialSummary?.investissementInitial.toLocaleString()} €</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-600">Coûts maintenance (20 ans)</td>
                <td className="py-2 font-semibold text-right">{financialSummary?.coutsMaintenance20ans.toLocaleString()} €</td>
              </tr>
              <tr className="border-b border-gray-200 bg-green-50">
                <td className="py-2 text-gray-600">Économies d'énergie (20 ans)</td>
                <td className="py-2 font-semibold text-right text-green-600">
                  +{financialSummary?.economiesEnergie20ans.toLocaleString()} €
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 font-semibold text-gray-900">Surplus net</td>
                <td className="py-2 font-bold text-right text-blue-600">
                  +{financialSummary?.surPlus.toLocaleString()} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Impact environnemental (20 ans)</h3>
        </CardHeader>
        <div className="p-6 grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Émissions CO₂ évitées</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{environmentalImpact?.emissionsCo2Evitees}</div>
            <div className="text-xs text-gray-500 mt-1">tonnes</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Équivalent en arbres plantés</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{environmentalImpact?.equivalentArbres}</div>
            <div className="text-xs text-gray-500 mt-1">arbres</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Part d'énergie renouvelable</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{environmentalImpact?.energieRenouvelable}%</div>
            <div className="text-xs text-gray-500 mt-1">de couverture</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
