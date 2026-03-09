'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/shared/Header';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Form';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Batiment {
  id: string;
  numero: number;
  designation: string;
  parc: number;
  etatInitial: any;
  etatReference?: any;
}

interface AffaireData {
  id: string;
  nomClient: string;
  ville: string;
  departement: string;
  tempExtBase?: number;
  tempIntBase?: number;
  djuRetenu?: number;
  augmentationFossile?: number;
  augmentationBiomasse?: number;
  dureeEmprunt?: number;
  batiments?: Batiment[];
}

interface CalculsResult {
  batiments: any[];
  parcAgregation: any[];
  chiffrage: any[];
  bilanActualize: any[];
}

export default function ResultatsPage() {
  const params = useParams();
  const affaireId = params.id as string;

  const [affaire, setAffaire] = useState<AffaireData | null>(null);
  const [calculs, setCalculs] = useState<CalculsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('synthese');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger l'affaire
        const affaireRes = await fetch(`/api/affaires/${affaireId}`);
        if (!affaireRes.ok) throw new Error('Affaire non trouvée');
        const affaireData: AffaireData = await affaireRes.json();
        setAffaire(affaireData);

        // Charger les calculs
        const calculsRes = await fetch(`/api/calculs/${affaireId}`);
        if (calculsRes.ok) {
          const calculsData: CalculsResult = await calculsRes.json();
          setCalculs(calculsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [affaireId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Chargement des résultats...</div>
        </main>
      </div>
    );
  }

  if (!affaire) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Alert type="error">Affaire non trouvée</Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{affaire.nomClient}</h1>
          <p className="text-gray-600">
            {affaire.ville} • {affaire.departement} • Étude de faisabilité biomasse
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'synthese', label: '📊 Synthèse' },
            { id: 'batiments', label: '🏢 Bâtiments' },
            { id: 'bilan', label: '💰 Bilan 20 ans' },
            { id: 'emissions', label: '🌱 Émissions CO₂' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SYNTHÈSE */}
        {activeTab === 'synthese' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {calculs?.parcAgregation?.[0] && (
                <>
                  <Card className="bg-white border border-gray-200">
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Puissance totale</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {calculs.parcAgregation[0].puissance_kW?.toFixed(1)} kW
                      </p>
                    </div>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Conso annuelle</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(calculs.parcAgregation[0].conso_kWh / 1000)?.toFixed(0)} MWh
                      </p>
                    </div>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Coût initial</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {calculs.chiffrage?.[0]?.investissement_ttc?.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                  </Card>

                  <Card className="bg-white border border-gray-200">
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Économies/an</p>
                      <p className="text-2xl font-bold text-red-600">
                        {calculs.bilanActualize?.[0]?.economies_an_1?.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                  </Card>
                </>
              )}
            </div>

            {/* Tableau bâtiments */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Bâtiments analysés</h2>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">#</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Désignation</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Parc</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Rendement</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Conso (kWh)</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Coût/an</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculs?.batiments?.map((bat: any, idx: number) => (
                      <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{bat.numero}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{bat.designation}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Parc {bat.parc}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {(bat.rendement_moyen * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                          {bat.conso_pcs?.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {bat.cout_annuel?.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* BÂTIMENTS */}
        {activeTab === 'batiments' && (
          <div className="grid grid-cols-2 gap-6">
            {affaire.batiments?.map((bat) => (
              <Card key={bat.id} className="bg-white border border-gray-200">
                <CardHeader className="border-b border-gray-200 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bâtiment n°{bat.numero}</h3>
                    <p className="text-sm text-gray-600 mt-1">{bat.designation}</p>
                  </div>
                  {/* Étiquette DPE */}
                  {calculs?.batiments?.[bat.numero - 1]?.etiquette_dpe && (
                    <div className="flex flex-col items-center justify-center ml-4">
                      {(() => {
                        const dpeLabel = calculs.batiments[bat.numero - 1].etiquette_dpe as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
                        const dpeColors: Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G', string> = {
                          A: '#10b981',
                          B: '#84cc16',
                          C: '#eab308',
                          D: '#f97316',
                          E: '#ef4444',
                          F: '#dc2626',
                          G: '#7f1d1d',
                        };
                        return (
                          <div
                            className="w-16 h-16 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: dpeColors[dpeLabel] || '#6b7280',
                            }}
                          >
                            <span className="text-2xl font-bold text-white">
                              {dpeLabel}
                            </span>
                          </div>
                        );
                      })()}
                      <p className="text-xs text-gray-500 mt-2">DPE</p>
                    </div>
                  )}
                </CardHeader>
                <div className="p-6 space-y-4">
                  {calculs?.batiments?.[bat.numero - 1] && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Rendement</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {(calculs.batiments[bat.numero - 1].rendement_moyen * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Conso PCS</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {calculs.batiments[bat.numero - 1].conso_pcs?.toLocaleString('fr-FR')}
                            <span className="text-sm font-normal text-gray-600"> kWh</span>
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Coût annuel</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {calculs.batiments[bat.numero - 1].cout_annuel?.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </p>
                      </div>
                      {calculs.batiments[bat.numero - 1].conso_kwhep_per_m2 && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Conso spécifique</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {calculs.batiments[bat.numero - 1].conso_kwhep_per_m2.toFixed(1)}{' '}
                            <span className="text-sm font-normal text-gray-600">kWh/m²/an</span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* BILAN 20 ANS */}
        {activeTab === 'bilan' && calculs?.bilanActualize && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Bilan actualisé 20 ans</h2>
              <p className="text-sm text-gray-600 mt-1">
                Évolution des coûts : État Initial vs Référence vs Biomasse
              </p>
            </CardHeader>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={calculs.bilanActualize.map((year: any) => ({
                    annee: year.annee,
                    initial: year.cout_initial,
                    reference: year.cout_reference,
                    biomasse: year.cout_biomasse,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="annee" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) =>
                      typeof value === 'number' ? `${(value / 1000).toFixed(1)}k€` : value
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="initial"
                    stroke="#ef4444"
                    name="État initial (Fossile)"
                  />
                  <Line
                    type="monotone"
                    dataKey="reference"
                    stroke="#f59e0b"
                    name="Référence (Gaz)"
                  />
                  <Line
                    type="monotone"
                    dataKey="biomasse"
                    stroke="#10b981"
                    name="Biomasse"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Total économies */}
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Économies totales sur 20 ans</p>
                <p className="text-3xl font-bold text-green-600">
                  {calculs.bilanActualize.reduce((sum: number, y: any) => sum + (y.economies_bio_vs_ref || 0), 0)
                    .toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ÉMISSIONS CO₂/SO₂ */}
        {activeTab === 'emissions' && calculs?.batiments && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Émissions CO₂ par bâtiment</h2>
              </CardHeader>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={calculs.batiments.map((bat: any) => ({
                      batiment: `Bâtiment ${bat.numero}`,
                      co2_initial: bat.co2_initial || 0,
                      co2_reference: bat.co2_reference || 0,
                      co2_biomasse: bat.co2_biomasse || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="batiment" />
                    <YAxis label={{ value: 'CO₂ (tonnes/an)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(2)} t` : value} />
                    <Legend />
                    <Bar dataKey="co2_initial" fill="#ef4444" name="État initial" />
                    <Bar dataKey="co2_reference" fill="#f59e0b" name="Référence" />
                    <Bar dataKey="co2_biomasse" fill="#10b981" name="Biomasse" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Réduction CO₂ */}
            <Card className="bg-green-50 border border-green-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Réduction d'émissions</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">CO₂ économisé/an (vs Référence)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculs.batiments.reduce((sum: number, b: any) => sum + (b.co2_savings || 0), 0)
                        .toFixed(1)}
                      <span className="text-sm font-normal text-gray-600"> tonnes</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">SO₂ économisé/an (vs Référence)</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {calculs.batiments.reduce((sum: number, b: any) => sum + (b.so2_savings || 0), 0)
                        .toFixed(3)}
                      <span className="text-sm font-normal text-gray-600"> tonnes</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            📄 Imprimer
          </Button>
          <Button 
            onClick={() => window.print()} 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            💾 Exporter PDF
          </Button>
        </div>
      </main>
    </div>
  );
}
