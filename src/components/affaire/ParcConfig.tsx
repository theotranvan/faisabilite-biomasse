'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface Parc {
  id: string;
  numero: number;
  puissanceChaudiereBois?: number;
  rendementChaudiereBois?: number;
  typeBiomasse?: string;
  longueurReseau?: number;
  sectionReseau?: string;
  pourcentageCouvertureBois?: number;
}

interface ParcConfigProps {
  affaireId: string;
  parcs: Parc[];
  onSave: (parcs: Parc[]) => Promise<void>;
}

const TYPES_BIOMASSE = [
  { value: 'PLAQUETTE', label: 'Plaquette' },
  { value: 'GRANULES', label: 'Granulés' },
  { value: 'MISCANTHUS', label: 'Miscanthus' },
  { value: 'BUCHES', label: 'Bûches' },
];

const SECTIONS_RESEAU = [
  { value: 'DN25', label: 'DN25' },
  { value: 'DN32', label: 'DN32' },
  { value: 'DN40', label: 'DN40' },
  { value: 'DN50', label: 'DN50' },
];

export function ParcConfig({ parcs: initialParcs, onSave }: ParcConfigProps) {
  const [parcs, setParcs] = useState<Parc[]>(initialParcs.length > 0 ? initialParcs : [{ id: '1', numero: 1 }]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const updateParc = (numero: number, field: string, value: any) => {
    setParcs(parcs.map(p =>
      p.numero === numero
        ? { ...p, [field]: field.includes('percentage') || field.includes('rendement') || field.includes('puissance') || field.includes('longueur') ? parseFloat(value) || value : value }
        : p
    ));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      await onSave(parcs);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Configuration du réseau de chaleur</h3>
      </CardHeader>

      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}

      <div className="p-6 space-y-8">
        {parcs.map((parc) => (
          <div key={parc.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-4">Réseau {parc.numero}</h4>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Chaudière biomasse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de biomasse</label>
                <select
                  value={parc.typeBiomasse || ''}
                  onChange={(e) => updateParc(parc.numero, 'typeBiomasse', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {TYPES_BIOMASSE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puissance chaudière (kW)</label>
                <input
                  type="number"
                  value={parc.puissanceChaudiereBois || ''}
                  onChange={(e) => updateParc(parc.numero, 'puissanceChaudiereBois', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rendement chaudière (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parc.rendementChaudiereBois || ''}
                  onChange={(e) => updateParc(parc.numero, 'rendementChaudiereBois', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0.85"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">% Couverture biomasse</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parc.pourcentageCouvertureBois || ''}
                  onChange={(e) => updateParc(parc.numero, 'pourcentageCouvertureBois', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0.80"
                />
              </div>
            </div>

            {/* Réseau de chaleur */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h5 className="font-medium text-gray-900 mb-4">Réseau de chaleur</h5>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longueur réseau (ml)</label>
                  <input
                    type="number"
                    value={parc.longueurReseau || ''}
                    onChange={(e) => updateParc(parc.numero, 'longueurReseau', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section réseau</label>
                  <select
                    value={parc.sectionReseau || ''}
                    onChange={(e) => updateParc(parc.numero, 'sectionReseau', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {SECTIONS_RESEAU.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Bouton sauvegarde */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
          >
            Enregistrer la configuration
          </Button>
        </div>
      </div>
    </Card>
  );
}
