'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface ChiffrageBiomasse {
  id: string;
  affaireId: string;
  coutInstallationChaudieres: number;
  coutInstallationReseau: number;
  coutInstallateurLocalBois: number;
  coutMaintenanceAnnuelleChaudieres: number;
  coutMaintenanceAnnuelleReseau: number;
  coutMaintenanceAnnuelleEntreprise: number;
  tauxCreditImpot?: number;
  tauxEco?: number;
}

interface ChiffrageBiomasseFProps {
  affaireId: string;
  data?: ChiffrageBiomasse;
  onSave: (data: ChiffrageBiomasse) => Promise<void>;
}

export function ChiffrageBiomasseForms({ affaireId, data, onSave }: ChiffrageBiomasseFProps) {
  const [formData, setFormData] = useState<Partial<ChiffrageBiomasse>>(data || {
    affaireId,
    coutInstallationChaudieres: 0,
    coutInstallationReseau: 0,
    coutInstallateurLocalBois: 0,
    coutMaintenanceAnnuelleChaudieres: 0,
    coutMaintenanceAnnuelleReseau: 0,
    coutMaintenanceAnnuelleEntreprise: 0,
    tauxCreditImpot: 0,
    tauxEco: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      await onSave(formData as ChiffrageBiomasse);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Chiffrage - Scénario biomasse</h3>
        <p className="text-sm text-gray-600 mt-1">Coûts d'installation et maintenance du système biomasse</p>
      </CardHeader>

      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}

      <div className="p-6 space-y-8">
        {/* Installation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Coûts d'installation</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chaudières biomasse (€)</label>
              <input
                type="number"
                value={formData.coutInstallationChaudieres || ''}
                onChange={(e) => handleChange('coutInstallationChaudieres', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="80000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réseau de chaleur (€)</label>
              <input
                type="number"
                value={formData.coutInstallationReseau || ''}
                onChange={(e) => handleChange('coutInstallationReseau', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="45000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installateur local bois (€)</label>
              <input
                type="number"
                value={formData.coutInstallateurLocalBois || ''}
                onChange={(e) => handleChange('coutInstallateurLocalBois', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="15000"
              />
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Coûts de maintenance annuels</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chaudières (€/an)</label>
              <input
                type="number"
                value={formData.coutMaintenanceAnnuelleChaudieres || ''}
                onChange={(e) => handleChange('coutMaintenanceAnnuelleChaudieres', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="6000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réseau (€/an)</label>
              <input
                type="number"
                value={formData.coutMaintenanceAnnuelleReseau || ''}
                onChange={(e) => handleChange('coutMaintenanceAnnuelleReseau', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="3000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (€/an)</label>
              <input
                type="number"
                value={formData.coutMaintenanceAnnuelleEntreprise || ''}
                onChange={(e) => handleChange('coutMaintenanceAnnuelleEntreprise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="12000"
              />
            </div>
          </div>
        </div>

        {/* Aides */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Aides et crédits</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux crédit d'impôt (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tauxCreditImpot || ''}
                onChange={(e) => handleChange('tauxCreditImpot', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux éco-chèque (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tauxEco || ''}
                onChange={(e) => handleChange('tauxEco', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </Card>
  );
}
