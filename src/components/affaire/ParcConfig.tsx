'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import {
  calculConsommationsSortieChaudiereBois,
  calculConsommationsEntreeChaudiereBois,
  calculConsommationsAppoint,
  calculStockage10jours,
  calculVolumeCendres,
  calculHeuresPP,
} from '@/lib/calculs';

interface Parc {
  id: string;
  numero: number;
  puissanceChaudiereBois?: number;
  rendementChaudiereBois?: number;
  puissanceChaudiere2?: number;
  rendementChaudiere2?: number;
  typeBiomasse?: string;
  longueurReseau?: number;
  sectionReseau?: string;
  pourcentageCouvertureBois?: number;
  volumeCamion?: number;
  volumeSilo?: number;
  kmHaieAn?: number;
  stereAn?: number;
  combustibleAppoint?: string;
}

interface ParcConfigProps {
  affaireId: string;
  parcs: Parc[];
  consoBatimentsParParc?: Record<number, number>; // conso sortie chaudières ref par parc
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

const BIOMASSE_CHARACTERISTICS: Record<string, { pci: number; masseVolumique: number; tauxCendre: number }> = {
  PLAQUETTE: { pci: 3.8, masseVolumique: 225, tauxCendre: 0.01 },
  GRANULES: { pci: 4.6, masseVolumique: 650, tauxCendre: 0.005 },
  MISCANTHUS: { pci: 4.2, masseVolumique: 120, tauxCendre: 0.03 },
  BUCHES: { pci: 4.0, masseVolumique: 420, tauxCendre: 0.01 },
};

export function ParcConfig({ parcs: initialParcs, consoBatimentsParParc = {}, onSave }: ParcConfigProps) {
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
                  step="1"
                  min="0"
                  max="100"
                  value={parc.rendementChaudiereBois || ''}
                  onChange={(e) => updateParc(parc.numero, 'rendementChaudiereBois', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="85"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">% Couverture biomasse</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={parc.pourcentageCouvertureBois || ''}
                  onChange={(e) => updateParc(parc.numero, 'pourcentageCouvertureBois', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puissance chaudière appoint (kW)</label>
                <input
                  type="number"
                  value={parc.puissanceChaudiere2 || ''}
                  onChange={(e) => updateParc(parc.numero, 'puissanceChaudiere2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rendement chaudière appoint (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parc.rendementChaudiere2 || ''}
                  onChange={(e) => updateParc(parc.numero, 'rendementChaudiere2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0.85"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible appoint</label>
                  <select
                    value={parc.combustibleAppoint || ''}
                    onChange={(e) => updateParc(parc.numero, 'combustibleAppoint', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="GAZ_NATUREL">Gaz naturel</option>
                    <option value="FUEL">Fuel</option>
                    <option value="GAZ_PROPANE">Gaz propane</option>
                    <option value="ELECTRICITE">Électricité</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Paramètres logistiques */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h5 className="font-medium text-gray-900 mb-4">Logistique</h5>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume camion (m³)</label>
                  <input
                    type="number"
                    value={parc.volumeCamion ?? 90}
                    onChange={(e) => updateParc(parc.numero, 'volumeCamion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="90"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume silo (m³)</label>
                  <input
                    type="number"
                    value={parc.volumeSilo || ''}
                    onChange={(e) => updateParc(parc.numero, 'volumeSilo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km haie / an</label>
                  <input
                    type="number"
                    step="0.1"
                    value={parc.kmHaieAn || ''}
                    onChange={(e) => updateParc(parc.numero, 'kmHaieAn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                {parc.typeBiomasse === 'BUCHES' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stère / an</label>
                    <input
                      type="number"
                      value={parc.stereAn || ''}
                      onChange={(e) => updateParc(parc.numero, 'stereAn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Résultats calculés automatiquement */}
            {(() => {
              const consoBatiments = consoBatimentsParParc[parc.numero] || 0;
              const couverture = parc.pourcentageCouvertureBois || 0;
              const rendBois = parc.rendementChaudiereBois || 0;
              const rendAppoint = parc.rendementChaudiere2 || 0;
              const puissanceBois = parc.puissanceChaudiereBois || 0;
              const characteristics = BIOMASSE_CHARACTERISTICS[parc.typeBiomasse || ''];

              if (!consoBatiments || !couverture || !rendBois) return null;

              const consoSortieBois = calculConsommationsSortieChaudiereBois(consoBatiments, couverture);
              const consoEntreeBois = rendBois > 0 ? calculConsommationsEntreeChaudiereBois(consoSortieBois, rendBois) : 0;
              const consoAppoint = rendAppoint > 0 ? calculConsommationsAppoint(consoBatiments, couverture, rendAppoint) : 0;
              const heuresPP = puissanceBois > 0 ? calculHeuresPP(consoSortieBois, puissanceBois) : 0;

              const stockage = characteristics
                ? calculStockage10jours((consoEntreeBois / 365) * 10, characteristics.pci, characteristics.masseVolumique)
                : null;
              const cendres = characteristics
                ? calculVolumeCendres(consoEntreeBois, characteristics.tauxCendre, characteristics.masseVolumique)
                : null;

              return (
                <div className="mt-6 pt-6 border-t-2 border-green-300">
                  <h5 className="font-semibold text-green-800 mb-4">Résultats calculés</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <span className="text-gray-600">Conso sortie chaudière bois</span>
                      <div className="font-bold text-green-700">{consoSortieBois.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh/an</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <span className="text-gray-600">Conso entrée chaudière bois</span>
                      <div className="font-bold text-green-700">{consoEntreeBois.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh/an</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <span className="text-gray-600">Conso appoint</span>
                      <div className="font-bold text-orange-700">{consoAppoint.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh/an</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <span className="text-gray-600">Heures pleine puissance</span>
                      <div className="font-bold text-blue-700">{heuresPP.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} h</div>
                    </div>
                    {stockage && (
                      <>
                        <div className="bg-white p-3 rounded border border-yellow-200">
                          <span className="text-gray-600">Stockage 10 jours</span>
                          <div className="font-bold text-yellow-700">{stockage.tonnes.toFixed(1)} t / {stockage.m3.toFixed(1)} m³</div>
                        </div>
                      </>
                    )}
                    {cendres && (
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <span className="text-gray-600">Volume de cendres</span>
                        <div className="font-bold text-gray-700">{cendres.m3.toFixed(2)} m³ / {cendres.kg.toFixed(0)} kg</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
