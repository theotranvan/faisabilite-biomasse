'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface ChiffragReference {
  id: string;
  affaireId: string;
  puissanceInstallee: number;
  coutInstallation: number;
  coutMaintenanceAnnuelle: number;
  tauxCreditImpot?: number;
}

interface ChiffrageReferenceFProps {
  affaireId: string;
  data?: ChiffragReference;
  onSave: (data: ChiffragReference) => Promise<void>;
}

export function ChiffrageReferenceForm({ affaireId, data, onSave }: ChiffrageReferenceFProps) {
  const [formData, setFormData] = useState<Partial<ChiffragReference>>(data || {
    affaireId,
    puissanceInstallee: 0,
    coutInstallation: 0,
    coutMaintenanceAnnuelle: 0,
    tauxCreditImpot: 0,
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
      await onSave(formData as ChiffragReference);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Chiffrage - Scénario de référence</h3>
        <p className="text-sm text-gray-600 mt-1">Coûts de la solution énergétique actuelle</p>
      </CardHeader>

      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puissance installée (kW)</label>
            <input
              type="number"
              value={formData.puissanceInstallee || ''}
              onChange={(e) => handleChange('puissanceInstallee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coût installation (€)</label>
            <input
              type="number"
              value={formData.coutInstallation || ''}
              onChange={(e) => handleChange('coutInstallation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coût maintenance annuelle (€)</label>
            <input
              type="number"
              value={formData.coutMaintenanceAnnuelle || ''}
              onChange={(e) => handleChange('coutMaintenanceAnnuelle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="3000"
            />
          </div>

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
