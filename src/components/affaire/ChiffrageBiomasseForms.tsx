'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface ChiffrageBiomAsseForms {
  affaireId: string;
  // 10 postes chaufferie biomasse
  vrd: number;
  grosOeuvre: number;
  charpente: number;
  processBois: number;
  chaudierAppoint: number;
  hydraulique: number;
  reseauChaleur: number;
  sousStation: number;
  installationReseauBat: number;
  autreTravaux: number;
  // Frais annexes
  bureauControle: number;
  maitriseOeuvre: number;
  fraisDivers: number;
  aleas: number;
  // Subventions
  cotEnr: number;
  aideDepartementale: number;
  detrDsil: number;
  subventionComplementaire: number;
  // Exploitation
  p2: number;
  consoElecSupplement: number;
  // Emprunt
  emprunt_biomasse?: number;
}

interface ChiffrageBiomAsseFormsProps {
  affaireId: string;
  data?: Partial<ChiffrageBiomAsseForms>;
  onSave: (data: ChiffrageBiomAsseForms) => Promise<void>;
}

export function ChiffrageBiomasseForms({ affaireId, data, onSave }: ChiffrageBiomAsseFormsProps) {
  const [formData, setFormData] = useState<Partial<ChiffrageBiomAsseForms>>(data || {
    affaireId,
    // Chaufferie biomasse postes
    vrd: 0,
    grosOeuvre: 0,
    charpente: 0,
    processBois: 0,
    chaudierAppoint: 0,
    hydraulique: 0,
    reseauChaleur: 0,
    sousStation: 0,
    installationReseauBat: 0,
    autreTravaux: 0,
    // Frais annexes
    bureauControle: 0.05,
    maitriseOeuvre: 0.13,
    fraisDivers: 0.02,
    aleas: 0.05,
    // Subventions
    cotEnr: 0,
    aideDepartementale: 0,
    detrDsil: 0,
    subventionComplementaire: 0,
    // Exploitation
    p2: 0,
    consoElecSupplement: 0,
    // Emprunt
    emprunt_biomasse: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      await onSave(formData as ChiffrageBiomAsseForms);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals
  const sousTotalChaufferie =
    (formData.vrd || 0) +
    (formData.grosOeuvre || 0) +
    (formData.charpente || 0) +
    (formData.processBois || 0) +
    (formData.chaudierAppoint || 0) +
    (formData.hydraulique || 0) +
    (formData.reseauChaleur || 0) +
    (formData.sousStation || 0) +
    (formData.installationReseauBat || 0) +
    (formData.autreTravaux || 0);

  const totalFeeRates =
    (formData.bureauControle || 0) +
    (formData.maitriseOeuvre || 0) +
    (formData.fraisDivers || 0) +
    (formData.aleas || 0);

  const fraisAnnexes = sousTotalChaufferie * totalFeeRates;
  const sousTotalTravaux = sousTotalChaufferie + fraisAnnexes;

  const totalSubventions =
    (formData.cotEnr || 0) +
    (formData.aideDepartementale || 0) +
    (formData.detrDsil || 0) +
    (formData.subventionComplementaire || 0);

  const investissementHTNetSubventions = sousTotalTravaux - totalSubventions;
  const investissementTTC = investissementHTNetSubventions * 1.2;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Chiffrage - Scénario biomasse</h3>
          <p className="text-sm text-gray-600 mt-1">
            10 postes chaufferie biomasse + frais annexes + subventions + exploitation
          </p>
        </CardHeader>

        {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}

        <div className="p-6 space-y-8">
          {/* Chaufferie Biomasse - 10 postes */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">1. Postes Chaufferie Biomasse (€)</h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              {[
                { key: 'vrd', label: 'VRD' },
                { key: 'grosOeuvre', label: 'Gros œuvre' },
                { key: 'charpente', label: 'Charpente' },
                { key: 'processBois', label: 'Process bois' },
                { key: 'chaudierAppoint', label: 'Chaudière appoint' },
                { key: 'hydraulique', label: 'Hydraulique' },
                { key: 'reseauChaleur', label: 'Réseau chaleur' },
                { key: 'sousStation', label: 'Sous-station' },
                { key: 'installationReseauBat', label: 'Installation réseau bâtiments' },
                { key: 'autreTravaux', label: 'Autres travaux' },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  <input
                    type="number"
                    value={formData[item.key as keyof typeof formData] || ''}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-64 flex justify-between py-2 border-t-2 border-gray-400 font-semibold">
                <span>Sous-total Chaufferie :</span>
                <span>{sousTotalChaufferie.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
              </div>
            </div>
          </div>

          {/* Frais Annexes */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">2. Frais Annexes (%)</h4>
            <div className="grid grid-cols-4 gap-4">
              {[
                { key: 'bureauControle', label: 'Bureau de Contrôle' },
                { key: 'maitriseOeuvre', label: 'Maîtrise d\'œuvre' },
                { key: 'fraisDivers', label: 'Frais Divers' },
                { key: 'aleas', label: 'Aléas' },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[item.key as keyof typeof formData] || ''}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between py-2">
                  <span>Total taux :</span>
                  <span className="font-semibold">{(totalFeeRates * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-300">
                  <span>Frais Annexes :</span>
                  <span className="font-semibold">
                    {fraisAnnexes.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-gray-400 bg-blue-50">
                  <span className="font-bold">Sous-total Travaux :</span>
                  <span className="font-bold text-blue-600">
                    {sousTotalTravaux.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subventions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">3. Subventions (€)</h4>
            <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
              {[
                { key: 'cotEnr', label: 'COT ENR' },
                { key: 'aideDepartementale', label: 'Aide Départementale' },
                { key: 'detrDsil', label: 'DETR/DSIL' },
                { key: 'subventionComplementaire', label: 'Subvention Complémentaire' },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  <input
                    type="number"
                    value={formData[item.key as keyof typeof formData] || ''}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-64 flex justify-between py-2 border-t-2 border-green-500 font-semibold">
                <span>Total Subventions :</span>
                <span className="text-green-600">-{totalSubventions.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="font-semibold">Investissement HT (net subventions) :</span>
                <span className="font-bold text-lg">
                  {investissementHTNetSubventions.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-400">
                <span className="font-semibold">Investissement TTC (20%) :</span>
                <span className="font-bold text-lg text-blue-600">
                  {investissementTTC.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </span>
              </div>
            </div>
          </div>

          {/* Exploitation */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">4. Exploitation (€/an)</h4>
            <div className="grid grid-cols-2 gap-6 bg-yellow-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P2 (€/an)</label>
                <input
                  type="number"
                  value={formData.p2 || ''}
                  onChange={(e) => handleChange('p2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consommation élec supplémentaire (€/an)</label>
                <input
                  type="number"
                  value={formData.consoElecSupplement || ''}
                  onChange={(e) => handleChange('consoElecSupplement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Financement */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">5. Financement</h4>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant d'emprunt (€)</label>
              <input
                type="number"
                value={formData.emprunt_biomasse || ''}
                onChange={(e) => handleChange('emprunt_biomasse', e.target.value)}
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
