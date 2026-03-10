'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface Batiment {
  id: string;
  numero: number;
  designation: string;
  typeBatiment: string;
  surfaceChauffee: number;
  volumeChauffe: number;
  parc: number;
  deperditions: number;
  rendementProduction: number;
  rendementDistribution: number;
  rendementEmission: number;
  rendementRegulation: number;
  coefIntermittence: number;
  consommationsCalculees?: number;
  consommationsReelles?: number;
  typeEnergie: string;
  tarification: number;
  abonnement: number;
  // État de référence
  refDeperditions?: number | null;
  refTypeEnergie?: string | null;
  refRendementProduction?: number | null;
  refRendementDistribution?: number | null;
  refRendementEmission?: number | null;
  refRendementRegulation?: number | null;
}

interface BatimentTableProps {
  affaireId: string;
  batiments: Batiment[];
  onSave: (batiments: Batiment[]) => Promise<void>;
  isLoading?: boolean;
}

const TYPES_BATIMENT = [
  { value: 'LOGEMENTS', label: 'Logements' },
  { value: 'BUREAUX', label: 'Bureaux' },
  { value: 'OCCUPATION_CONTINUE', label: 'Occupation continue' },
  { value: 'AUTRES', label: 'Autres' },
];

const TYPES_ENERGIE = [
  { value: 'FUEL', label: 'Fioul' },
  { value: 'GAZ_NATUREL', label: 'Gaz naturel' },
  { value: 'GAZ_PROPANE', label: 'Gaz propane' },
  { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'BOIS_DECHIQUETTE', label: 'Bois déchiquetté' },
];

export function BatimentTable({ batiments: initialBatiments, onSave }: Omit<BatimentTableProps, 'affaireId' | 'isLoading'>) {
  const [batiments, setBatiments] = useState<Batiment[]>(initialBatiments);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'etat_initial' | 'etat_ref'>('etat_initial');

  const addBatiment = () => {
    const newBatiment: Batiment = {
      id: `new-${Date.now()}`,
      numero: Math.max(...batiments.map(b => b.numero), 0) + 1,
      designation: 'Nouveau bâtiment',
      typeBatiment: 'LOGEMENTS',
      surfaceChauffee: 1000,
      volumeChauffe: 3000,
      parc: 1,
      deperditions: 50,
      rendementProduction: 0.85,
      rendementDistribution: 0.95,
      rendementEmission: 0.98,
      rendementRegulation: 0.97,
      coefIntermittence: 1,
      typeEnergie: 'GAZ_NATUREL',
      tarification: 0.08,
      abonnement: 150,
    };
    setBatiments([...batiments, newBatiment]);
  };

  const updateBatiment = (id: string, field: string, value: any) => {
    setBatiments(batiments.map(b =>
      b.id === id ? { ...b, [field]: field.includes('rendement') || field === 'coefIntermittence' || field === 'tarification' ? parseFloat(value) : isNaN(value) ? value : parseFloat(value) } : b
    ));
  };

  const deleteBatiment = (id: string) => {
    setBatiments(batiments.filter(b => b.id !== id));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      await onSave(batiments);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Bâtiments</h3>
          <Button variant="primary" size="sm" onClick={addBatiment}>
            + Ajouter bâtiment
          </Button>
        </div>
      </CardHeader>

      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}

      <div className="p-6 space-y-6">
        {/* Message vide */}
        {batiments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-lg text-gray-600 mb-4">Aucun bâtiment pour le moment</p>
            <p className="text-gray-500 mb-6">Commencez par ajouter le premier bâtiment à votre étude</p>
            <Button variant="primary" onClick={addBatiment}>
              + Ajouter le premier bâtiment
            </Button>
          </div>
        ) : (
          <>
            {/* Onglets */}
            <div className="flex gap-4 border-b border-gray-200 pb-4">
              <button
                onClick={() => setActiveTab('etat_initial')}
                className={`px-4 py-2 font-semibold transition ${activeTab === 'etat_initial' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              >
                État initial
              </button>
              <button
                onClick={() => setActiveTab('etat_ref')}
                className={`px-4 py-2 font-semibold transition ${activeTab === 'etat_ref' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              >
                État de référence
              </button>
            </div>

            {/* Tableau éditable */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">N°</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Désignation</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Parc</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Surface (m²)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Volume (m³)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Déperditions (kW)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Type énergie</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batiments.map((batiment) => (
                    <tr key={batiment.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 font-mono">{batiment.numero}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={batiment.designation}
                          onChange={(e) => updateBatiment(batiment.id, 'designation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={batiment.typeBatiment}
                          onChange={(e) => updateBatiment(batiment.id, 'typeBatiment', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {TYPES_BATIMENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={(batiment as any).parc || 1}
                          onChange={(e) => updateBatiment(batiment.id, 'parc', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={batiment.surfaceChauffee}
                          onChange={(e) => updateBatiment(batiment.id, 'surfaceChauffee', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={batiment.volumeChauffe}
                          onChange={(e) => updateBatiment(batiment.id, 'volumeChauffe', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={batiment.deperditions}
                          onChange={(e) => updateBatiment(batiment.id, 'deperditions', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={batiment.typeEnergie}
                          onChange={(e) => updateBatiment(batiment.id, 'typeEnergie', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {TYPES_ENERGIE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => deleteBatiment(batiment.id)}
                          className="px-3 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Détails rendements par bâtiment - État initial */}
            {activeTab === 'etat_initial' && (
              <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">Rendements et tarifs par bâtiment (état initial)</p>
                {batiments.map((batiment) => (
                  <div key={batiment.id} className="mb-4 p-4 bg-white rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">{batiment.designation}</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt production</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.rendementProduction}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementProduction', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt distribution</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.rendementDistribution}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementDistribution', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt émission</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.rendementEmission}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementEmission', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt régulation</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.rendementRegulation}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementRegulation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Coef intermittence</label>
                        <input type="number" step="0.01" min="0" max="2" value={batiment.coefIntermittence}
                          onChange={(e) => updateBatiment(batiment.id, 'coefIntermittence', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Tarification (€/kWh)</label>
                        <input type="number" step="0.001" value={batiment.tarification}
                          onChange={(e) => updateBatiment(batiment.id, 'tarification', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Abonnement (€/an)</label>
                        <input type="number" value={batiment.abonnement}
                          onChange={(e) => updateBatiment(batiment.id, 'abonnement', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Onglet État de référence - champs ref* contrôlés */}
            {activeTab === 'etat_ref' && (
              <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-gray-600 mb-4">Modifier les valeurs de référence pour chaque bâtiment (après travaux d'isolation)</p>
                {batiments.map((batiment) => (
                  <div key={batiment.id} className="mb-4 p-4 bg-white rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">{batiment.designation}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="block text-gray-600 mb-1">Déperditions ref (kW)</label>
                        <input type="number" value={batiment.refDeperditions ?? ''}
                          onChange={(e) => updateBatiment(batiment.id, 'refDeperditions', e.target.value || null)}
                          placeholder={String(batiment.deperditions)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Type énergie ref</label>
                        <select value={batiment.refTypeEnergie || ''}
                          onChange={(e) => updateBatiment(batiment.id, 'refTypeEnergie', e.target.value || null)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                          <option value="">Identique initial</option>
                          {TYPES_ENERGIE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt production ref</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.refRendementProduction ?? ''}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementProduction', e.target.value || null)}
                          placeholder={String(batiment.rendementProduction)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt distribution ref</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.refRendementDistribution ?? ''}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementDistribution', e.target.value || null)}
                          placeholder={String(batiment.rendementDistribution)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt émission ref</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.refRendementEmission ?? ''}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementEmission', e.target.value || null)}
                          placeholder={String(batiment.rendementEmission)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt régulation ref</label>
                        <input type="number" step="0.01" min="0" max="1" value={batiment.refRendementRegulation ?? ''}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementRegulation', e.target.value || null)}
                          placeholder={String(batiment.rendementRegulation)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton sauvegarde */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
              >
                Enregistrer les bâtiments
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
