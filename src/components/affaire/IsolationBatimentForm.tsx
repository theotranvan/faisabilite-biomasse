'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import {
  LigneIsolation,
  calculerIsolationBatiment,
  ISOLATION_PRESETS,
  findIsolationPreset,
  IsolationPreset,
} from '@/lib/calculs/isolation';

interface IsolationBatimentFormProps {
  batimentNumero: number;
  batimentDesignation: string;
  initialLignes?: LigneIsolation[];
  onSave?: (lignes: LigneIsolation[]) => Promise<void>;
  onClose?: () => void;
}

export function IsolationBatimentForm({
  batimentNumero,
  batimentDesignation,
  initialLignes = [],
  onSave,
  onClose,
}: IsolationBatimentFormProps) {
  const [lignes, setLignes] = useState<LigneIsolation[]>(
    initialLignes.length > 0
      ? initialLignes
      : [
          {
            designation: '',
            unite: '',
            quantite: 0,
            prixUnitaire: 0,
            dejaRealise: 0,
          },
        ]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);

  // Autocomplétion pour les désignations
  const handleDesignationChange = (idx: number, value: string) => {
    const newLignes = [...lignes];
    newLignes[idx].designation = value;

    // Si exact match avec un preset, remplir unite et PU
    const preset = findIsolationPreset(value);
    if (preset) {
      newLignes[idx].unite = preset.unite;
      newLignes[idx].prixUnitaire = preset.prixUnitaire;
    }

    setLignes(newLignes);
  };

  const handleChange = (
    idx: number,
    field: keyof LigneIsolation,
    value: any
  ) => {
    const newLignes = [...lignes];
    if (field === 'quantite' || field === 'prixUnitaire' || field === 'dejaRealise') {
      newLignes[idx][field] = parseFloat(value) || 0;
    } else {
      newLignes[idx][field] = value;
    }
    setLignes(newLignes);
  };

  const addLigne = () => {
    setLignes([
      ...lignes,
      {
        designation: '',
        unite: '',
        quantite: 0,
        prixUnitaire: 0,
        dejaRealise: 0,
      },
    ]);
  };

  const deleteLigne = (idx: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== idx));
    }
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      // Valider que au moins une ligne soit complète
      const validated = lignes.filter(
        (l) => l.designation && l.quantite > 0 && l.prixUnitaire > 0
      );

      if (onSave) {
        await onSave(validated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const resultat = calculerIsolationBatiment(lignes.filter(
    (l) => l.designation && l.quantite > 0 && l.prixUnitaire > 0
  ));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            🏢 Bâtiment {batimentNumero}: {batimentDesignation}
          </h3>
          <p className="text-sm text-gray-600">
            Saisir les travaux d'isolation (pour information uniquement)
          </p>
        </CardHeader>

        {error && (
          <Alert type="error" className="m-6 mb-0">
            {error}
          </Alert>
        )}

        <div className="p-6 space-y-4">
          {/* Tableau éditable */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">
                    Désignation
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">
                    Unité
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">
                    Quantité
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">
                    PU (€)
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">
                    Total (€)
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">
                    Déjà réalisé (€)
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">
                    Reste (€)
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, idx) => {
                  const total = ligne.quantite * ligne.prixUnitaire;
                  const reste = total - ligne.dejaRealise;

                  return (
                    <tr
                      key={idx}
                      className={
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'
                      }
                    >
                      {/* Désignation avec autocomplétion */}
                      <td className="px-2 py-2 border-b border-gray-200">
                        <div className="relative">
                          <input
                            type="text"
                            value={ligne.designation}
                            onChange={(e) =>
                              handleDesignationChange(idx, e.target.value)
                            }
                            onFocus={() => setShowSuggestions(idx)}
                            onBlur={() =>
                              setTimeout(() => setShowSuggestions(null), 200)
                            }
                            placeholder="Isolati..." 
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            list={`suggestions-${idx}`}
                          />
                          {showSuggestions === idx && ligne.designation.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded z-10">
                              {ISOLATION_PRESETS.filter((p: IsolationPreset) =>
                                p.designation
                                  .toLowerCase()
                                  .includes(ligne.designation.toLowerCase())
                              ).map((p: IsolationPreset) => (
                                <div
                                  key={p.designation}
                                  onClick={() => {
                                    handleDesignationChange(idx, p.designation);
                                    setShowSuggestions(null);
                                  }}
                                  className="px-2 py-1 hover:bg-blue-100 cursor-pointer text-xs"
                                >
                                  {p.designation}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Unité */}
                      <td className="px-2 py-2 border-b border-gray-200">
                        <input
                          type="text"
                          value={ligne.unite}
                          onChange={(e) =>
                            handleChange(idx, 'unite', e.target.value)
                          }
                          placeholder="m² / U / ml"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </td>

                      {/* Quantité */}
                      <td className="px-2 py-2 border-b border-gray-200 text-right">
                        <input
                          type="number"
                          value={ligne.quantite || ''}
                          onChange={(e) =>
                            handleChange(idx, 'quantite', e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          step="0.01"
                        />
                      </td>

                      {/* Prix unitaire */}
                      <td className="px-2 py-2 border-b border-gray-200 text-right">
                        <input
                          type="number"
                          value={ligne.prixUnitaire || ''}
                          onChange={(e) =>
                            handleChange(idx, 'prixUnitaire', e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          step="0.01"
                        />
                      </td>

                      {/* Total (calculé, grisé) */}
                      <td className="px-2 py-2 border-b border-gray-200 text-right font-semibold bg-gray-100">
                        {total.toLocaleString('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>

                      {/* Déjà réalisé */}
                      <td className="px-2 py-2 border-b border-gray-200 text-right">
                        <input
                          type="number"
                          value={ligne.dejaRealise || ''}
                          onChange={(e) =>
                            handleChange(idx, 'dejaRealise', e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          step="0.01"
                        />
                      </td>

                      {/* Reste à réaliser (calculé) */}
                      <td className="px-2 py-2 border-b border-gray-200 text-right font-semibold">
                        {reste.toLocaleString('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>

                      {/* Action: Supprimer */}
                      <td className="px-2 py-2 border-b border-gray-200 text-center">
                        {lignes.length > 1 && (
                          <button
                            onClick={() => deleteLigne(idx)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer cette ligne"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bouton ajouter ligne */}
          <Button
            variant="secondary"
            size="sm"
            onClick={addLigne}
            className="w-full"
          >
            + Ajouter une ligne
          </Button>

          {/* Sous-totaux */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded border border-blue-200">
            <div>
              <p className="text-xs text-gray-600">Total isolation</p>
              <p className="text-lg font-bold text-blue-600">
                {resultat.totalIsolation.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                €
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Déjà réalisé</p>
              <p className="text-lg font-bold text-gray-700">
                {resultat.dejaRealise.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                €
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Reste à réaliser</p>
              <p className="text-lg font-bold text-green-600">
                {resultat.resteARealiser.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                €
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              className="flex-1"
            >
              💾 Enregistrer
            </Button>
            {onClose && (
              <Button variant="secondary" onClick={onClose} className="flex-1">
                ✕ Fermer
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
