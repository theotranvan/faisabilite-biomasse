'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface BddCout {
  id: string;
  categorie: string;
  designation: string;
  unite: string;
  prixUnitaire: number;
}

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
  montantP2?: number;
  emprunt_ref?: number;
}

interface ChiffrageReferenceFProps {
  affaireId: string;
  data?: Partial<ChiffragRefForm>;
  onSave: (data: ChiffragRefForm) => Promise<void>;
}

// Normalise un enregistrement venant de la BDD (noms de schéma : lignesChaufferie,
// tauxBureauControle, empruntRef…) OU déjà au format formulaire vers le format
// attendu par le formulaire. Indispensable pour que les données se rechargent
// après sauvegarde / changement de parc (sinon le formulaire revient vide).
function toFormRef(affaireId: string, data?: Partial<ChiffragRefForm> | any): Partial<ChiffragRefForm> {
  const defaults: Partial<ChiffragRefForm> = {
    affaireId,
    travauxChaufferie: [
      { id: '1', designation: 'Chaudière fioul', unite: 'unité', qte: 1, pu: 0 },
      { id: '2', designation: 'Réseau hydraulique', unite: 'm', qte: 0, pu: 0 },
    ],
    // Taux par défaut de l'Excel (chiffrage_ref : 0 / 13 % / 2 % / 5 %)
    bureauControle: 0,
    maitriseOeuvre: 0.13,
    fraisDivers: 0.02,
    aleas: 0.05,
    montantP2: 750,
    emprunt_ref: 0,
  };
  if (!data) return defaults;
  let lignes = data.travauxChaufferie;
  if (!lignes && typeof data.lignesChaufferie === 'string') {
    try { lignes = JSON.parse(data.lignesChaufferie); } catch { lignes = undefined; }
  } else if (!lignes && Array.isArray(data.lignesChaufferie)) {
    lignes = data.lignesChaufferie;
  }
  return {
    ...defaults,
    affaireId: data.affaireId ?? affaireId,
    ...(Array.isArray(lignes) && lignes.length ? { travauxChaufferie: lignes } : {}),
    bureauControle: data.bureauControle ?? data.tauxBureauControle ?? defaults.bureauControle,
    maitriseOeuvre: data.maitriseOeuvre ?? data.tauxMaitriseOeuvre ?? defaults.maitriseOeuvre,
    fraisDivers: data.fraisDivers ?? data.tauxFraisDivers ?? defaults.fraisDivers,
    aleas: data.aleas ?? data.tauxAleas ?? defaults.aleas,
    montantP2: data.montantP2 ?? defaults.montantP2,
    emprunt_ref: data.emprunt_ref ?? data.empruntRef ?? defaults.emprunt_ref,
  };
}

export function ChiffrageReferenceForm({ affaireId, data, onSave }: ChiffrageReferenceFProps) {
  const [formData, setFormData] = useState<Partial<ChiffragRefForm>>(() => toFormRef(affaireId, data));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [bddCouts, setBddCouts] = useState<BddCout[]>([]);

  useEffect(() => {
    // Autocomplete des coûts (non bloquant : la saisie manuelle reste possible).
    // On trace l'échec au lieu de l'avaler silencieusement.
    fetch('/api/costs')
      .then(r => r.json())
      .then(setBddCouts)
      .catch((e) => console.warn('Chargement BDD coûts (autocomplete) indisponible:', e));
  }, []);

  const handleLineChange = (idx: number, field: string, value: any) => {
    const newLines = [...(formData.travauxChaufferie || [])];
    if (field === 'designation') {
      // Check if value matches a BDD cost entry
      const bddEntry = bddCouts.find(c => c.designation === value);
      if (bddEntry) {
        newLines[idx] = {
          ...newLines[idx],
          designation: value,
          unite: bddEntry.unite,
          pu: bddEntry.prixUnitaire,
        };
      } else {
        newLines[idx] = { ...newLines[idx], designation: value };
      }
    } else {
      newLines[idx] = {
        ...newLines[idx],
        [field]: field === 'unite' ? value : parseFloat(value) || 0,
      };
    }
    setFormData(prev => ({ ...prev, travauxChaufferie: newLines }));
  };

  const handleFeeChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  // Taux en % : saisis en chiffre plein (ex. 13 pour 13 %) mais stockés en
  // décimal (0.13) — le calcul reste inchangé.
  const pctDisplay = (d?: number) => (!d ? '' : String(Math.round(d * 10000) / 100));
  const handlePctChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: (parseFloat(value) || 0) / 100 }));
  };

  const addLine = () => {
    const ids = (formData.travauxChaufferie || []).map(l => parseInt(l.id)).filter(n => !isNaN(n));
    const newId = (ids.length > 0 ? Math.max(...ids) : 0) + 1;
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
                        <select
                          value={ligne.designation}
                          onChange={(e) => handleLineChange(idx, 'designation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">-- Sélectionner --</option>
                          {Object.entries(
                            bddCouts.reduce((acc, c) => {
                              if (!acc[c.categorie]) acc[c.categorie] = [];
                              acc[c.categorie].push(c);
                              return acc;
                            }, {} as Record<string, BddCout[]>)
                          ).map(([cat, items]) => (
                            <optgroup key={cat} label={cat.replace(/_/g, ' ')}>
                              {items.map(item => (
                                <option key={item.id} value={item.designation}>
                                  {item.designation}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          {ligne.designation && !bddCouts.find(c => c.designation === ligne.designation) && (
                            <option value={ligne.designation}>{ligne.designation} (personnalisé)</option>
                          )}
                        </select>
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
                  step="0.1"
                  value={pctDisplay(formData.bureauControle)}
                  onChange={(e) => handlePctChange('bureauControle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maîtrise d'œuvre</label>
                <input
                  type="number"
                  step="0.1"
                  value={pctDisplay(formData.maitriseOeuvre)}
                  onChange={(e) => handlePctChange('maitriseOeuvre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="13"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frais Divers</label>
                <input
                  type="number"
                  step="0.1"
                  value={pctDisplay(formData.fraisDivers)}
                  onChange={(e) => handlePctChange('fraisDivers', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aléas</label>
                <input
                  type="number"
                  step="0.1"
                  value={pctDisplay(formData.aleas)}
                  onChange={(e) => handlePctChange('aleas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="5"
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

          {/* Exploitation & Financement */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Exploitation &amp; Financement</h4>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant P2 — entretien/maintenance (€/an)</label>
                <input
                  type="number"
                  value={formData.montantP2 ?? 750}
                  onChange={(e) => handleFeeChange('montantP2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="750"
                />
                <p className="text-xs text-gray-500 mt-1">Appliqué aux scénarios actuel et référence</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coût total du crédit / intérêts (€)</label>
                <input
                  type="number"
                  value={formData.emprunt_ref || ''}
                  onChange={(e) => handleFeeChange('emprunt_ref', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Intérêts/frais du crédit, ajoutés au capital net pour l&apos;annuité (≠ capital emprunté). Laisser 0 si non financé.</p>
              </div>
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
