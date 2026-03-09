'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface LigneChauufferie {
  id: string;
  designation: string;
  unite: string;
  qte: number;
  pu: number;
}

interface ChiffragRefForm {
  affaireId: string;
  travauxChaufferie: LigneChauufferie[];
  bureauControle: number;
  maitriseOeuvre: number;
  fraisDivers: number;
  aleas: number;
  emprunt_ref?: number;
}

interface ChiffrageReferenceFProps {
  affaireId: string;
  data?: Partial<ChiffragRefForm>;
  onSave: (data: ChiffragRefForm) => Promise<void>;
}

export function ChiffrageReferenceForm({ affaireId, data, onSave }: ChiffrageReferenceFProps) {
  const [formData, setFormData] = useState<Partial<ChiffragRefForm>>(data || {
    affaireId,
    travauxChaufferie: [
      { id: '1', designation: 'Chaudière fioul', unite: 'unité', qte: 1, pu: 0 },
      { id: '2', designation: 'Réseau hydraulique', unite: 'm', qte: 0, pu: 0 },
    ],
    bureauControle: 0.05,
    maitriseOeuvre: 0.13,
    fraisDivers: 0.02,
    aleas: 0.05,
    emprunt_ref: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleLineChange = (idx: number, field: string, value: any) => {
    const newLines = [...(formData.travauxChaufferie || [])];
    newLines[idx] = {
      ...newLines[idx],
      [field]: field === 'designation' || field === 'unite' ? value : parseFloat(value) || 0,
    };
    setFormData(prev => ({ ...prev, travauxChaufferie: newLines }));
  };

  const handleFeeChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const addLine = () => {
    const newId = Math.max(...(formData.travauxChaufferie?.map(l => parseInt(l.id)) || [0])) + 1;
    setFormData(prev => ({
      ...prev,
      travauxChaufferie: [
        ...(prev.travauxChaufferie || []),
        { id: newId.toString(), designation: '', unite: '', qte: 0, pu: 0 },
      ],
    }));
  };

  const removeLine = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      travauxChaufferie: prev.travauxChaufferie?.filter((_, i) => i !== idx) || [],
    }));
  };

  const sousTotalChaufferie = (formData.travauxChaufferie || []).reduce(
    (sum, ligne) => sum + (ligne.qte * ligne.pu),
    0
  );

  const totalFeeRates =
    (formData.bureauControle || 0) +
    (formData.maitriseOeuvre || 0) +
    (formData.fraisDivers || 0) +
    (formData.aleas || 0);

  const fraisAnnexes = sousTotalChaufferie * totalFeeRates;
  const totalInvestissementHT = sousTotalChaufferie + fraisAnnexes;
  const investissementTTC = totalInvestissementHT * 1.2;

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      await onSave(formData as ChiffragRefForm);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Chiffrage - Scénario de référence</h3>
          <p className="text-sm text-gray-600 mt-1">Travaux chaufferie : ligne par ligne (Désignation, Unité, Qté, PU)</p>
        </CardHeader>

        {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}

        <div className="p-6 space-y-6">
          {/* Travaux Chaufferie Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Travaux Chaufferie</h4>
              <Button
                onClick={addLine}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                + Ajouter une ligne
              </Button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Désignation</th>
                    <th className="px-3 py-2 text-center">Unité</th>
                    <th className="px-3 py-2 text-right">Qté</th>
                    <th className="px-3 py-2 text-right">P.U. (€)</th>
                    <th className="px-3 py-2 text-right">Total (€)</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.travauxChaufferie?.map((ligne, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={ligne.designation}
                          onChange={(e) => handleLineChange(idx, 'designation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Ex: Chaudière"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={ligne.unite}
                          onChange={(e) => handleLineChange(idx, 'unite', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Ex: unité"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={ligne.qte}
                          onChange={(e) => handleLineChange(idx, 'qte', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={ligne.pu}
                          onChange={(e) => handleLineChange(idx, 'pu', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {(ligne.qte * ligne.pu).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeLine(idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end pr-4">
              <div className="w-64">
                <div className="flex justify-between py-2 border-t-2 border-gray-300 font-semibold">
                  <span>Sous-total Chaufferie :</span>
                  <span>{sousTotalChaufferie.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Frais Annexes */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Frais Annexes (%)</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bureau de Contrôle</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.bureauControle || ''}
                  onChange={(e) => handleFeeChange('bureauControle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0.05"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maîtrise d'œuvre</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maitriseOeuvre || ''}
                  onChange={(e) => handleFeeChange('maitriseOeuvre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0.13"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frais Divers</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fraisDivers || ''}
                  onChange={(e) => handleFeeChange('fraisDivers', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0.02"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aléas</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.aleas || ''}
                  onChange={(e) => handleFeeChange('aleas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0.05"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end pr-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between py-2 border-t border-gray-300">
                  <span>Total taux :</span>
                  <span className="font-semibold">{(totalFeeRates * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Frais Annexes :</span>
                  <span className="font-semibold">
                    {fraisAnnexes.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-gray-400 bg-blue-50">
                  <span className="font-bold">Total Investissement HT :</span>
                  <span className="font-bold text-blue-600">
                    {totalInvestissementHT.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-gray-50">
                  <span className="font-bold">Total Investissement TTC (20%) :</span>
                  <span className="font-bold text-gray-600">
                    {investissementTTC.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financement */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Financement</h4>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant d'emprunt (€)</label>
              <input
                type="number"
                value={formData.emprunt_ref || ''}
                onChange={(e) => handleFeeChange('emprunt_ref', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
