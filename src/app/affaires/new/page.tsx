'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { Button, Input, Select, TextArea } from '@/components/ui/Form';
import { DEPARTEMENTS, DEPT_TO_VILLE_MONOTONE } from '@/lib/enums';

interface FormAffaire {
  nomClient: string;
  adresse: string;
  ville: string;
  departement: string;
  notes: string;
  tempExtBase: number;
  tempIntBase: number;
  djuRetenu: number;
  augmentationFossile: number;
  augmentationBiomasse: number;
  dureeEmprunt: number;
  villeMonotone: string;
}

export default function NewAffairePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [affaire, setAffaire] = useState<FormAffaire>({
    nomClient: '',
    adresse: '',
    ville: '',
    departement: '18',
    notes: '',
    tempExtBase: -7,
    tempIntBase: 19,
    djuRetenu: 1977,
    augmentationFossile: 0.04,
    augmentationBiomasse: 0.02,
    dureeEmprunt: 15,
    villeMonotone: DEPT_TO_VILLE_MONOTONE['18'] || 'Bourges',
  });

  // Load DJU + tempExtBase for default département on mount
  useEffect(() => {
    fetch('/api/meteo/18')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setAffaire(prev => ({
            ...prev,
            ...(data.dju ? { djuRetenu: Math.round(data.dju) } : {}),
            ...(data.tempExtBase != null ? { tempExtBase: data.tempExtBase } : {}),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleAffaireChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updated = {
      ...affaire,
      [name]:
        name.includes('Base') || name.includes('dju') || name.includes('ugmentation') || name.includes('uree')
          ? parseFloat(value) || 0
          : value,
    };
    setAffaire(updated);

    // Auto-fetch DJU and tempExtBase when département changes
    if (name === 'departement') {
      // Auto-fill villeMonotone from département mapping
      const villeM = DEPT_TO_VILLE_MONOTONE[value];
      if (villeM) {
        setAffaire(prev => ({ ...prev, villeMonotone: villeM }));
      }

      fetch(`/api/meteo/${value}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setAffaire(prev => ({
              ...prev,
              ...(data.dju ? { djuRetenu: Math.round(data.dju) } : {}),
              ...(data.tempExtBase != null ? { tempExtBase: data.tempExtBase } : {}),
            }));
          }
        })
        .catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!affaire.nomClient || !affaire.ville || !affaire.departement) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/affaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomClient: affaire.nomClient,
          adresse: affaire.adresse,
          ville: affaire.ville,
          departement: affaire.departement,
          tempExtBase: affaire.tempExtBase,
          tempIntBase: affaire.tempIntBase,
          djuRetenu: affaire.djuRetenu,
          augmentationFossile: affaire.augmentationFossile,
          augmentationBiomasse: affaire.augmentationBiomasse,
          dureeEmprunt: affaire.dureeEmprunt,
          villeMonotone: affaire.villeMonotone,
          notes: affaire.notes,
          statut: 'BROUILLON',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Erreur lors de la création');
        return;
      }

      const newAffaire = await response.json();
      // La suite (bâtiments, configuration biomasse, chiffrages) se remplit
      // sur la fiche affaire — on arrive directement sur l'onglet Bâtiments.
      router.push(`/affaires/${newAffaire.id}?tab=batiments`);
    } catch (err) {
      setError('Erreur lors de la création de l\'affaire');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Titre */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Nouvelle étude de faisabilité
          </h1>
          <p className="text-lg text-gray-600">
            Biomasse - Chauffage - Réduction d'émissions CO₂
          </p>
        </div>

        {/* Messages */}
        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                📋 Paramètres généraux
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Après création, vous remplirez les bâtiments, la configuration biomasse
                et les chiffrages directement sur la fiche de l'affaire.
              </p>
            </CardHeader>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Nom du client *"
                  name="nomClient"
                  value={affaire.nomClient}
                  onChange={handleAffaireChange}
                  placeholder="Mairie de Bourges"
                  required
                />
                <Input
                  label="Ville *"
                  name="ville"
                  value={affaire.ville}
                  onChange={handleAffaireChange}
                  placeholder="Bourges"
                  required
                />
              </div>

              <Input
                label="Adresse"
                name="adresse"
                value={affaire.adresse}
                onChange={handleAffaireChange}
                placeholder="123 Rue de Rivoli"
              />

              <Select
                label="Département *"
                name="departement"
                value={affaire.departement}
                onChange={handleAffaireChange}
                options={DEPARTEMENTS}
                required
              />

              <TextArea
                label="Notes"
                name="notes"
                value={affaire.notes}
                onChange={handleAffaireChange}
                placeholder="Observations supplémentaires..."
                rows={3}
              />

              {/* Paramètres climatiques */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  🌡️ Paramètres climatiques
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  DJU et température extérieure de base sont préremplis automatiquement
                  selon le département (données SDES/Météo France) — ajustables si besoin.
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="Temp. int. base (°C)"
                    name="tempIntBase"
                    type="number"
                    value={affaire.tempIntBase}
                    onChange={handleAffaireChange}
                    step={0.1}
                  />
                  <Input
                    label="Temp. ext. base (°C)"
                    name="tempExtBase"
                    type="number"
                    value={affaire.tempExtBase}
                    onChange={handleAffaireChange}
                    step={0.1}
                  />
                  <Input
                    label="DJU retenu"
                    name="djuRetenu"
                    type="number"
                    value={affaire.djuRetenu}
                    onChange={handleAffaireChange}
                    step={1}
                  />
                  <Input
                    label="Durée emprunt (ans)"
                    name="dureeEmprunt"
                    type="number"
                    value={affaire.dureeEmprunt}
                    onChange={handleAffaireChange}
                    step={1}
                  />
                </div>
              </div>

              {/* Augmentations */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  📈 Facteurs d'augmentation annuelle
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Énergie fossile (%)"
                    name="augmentationFossile"
                    type="number"
                    value={affaire.augmentationFossile * 100}
                    onChange={(e) =>
                      setAffaire({
                        ...affaire,
                        augmentationFossile: parseFloat(e.target.value) / 100,
                      })
                    }
                    step={0.1}
                  />
                  <Input
                    label="Biomasse (%)"
                    name="augmentationBiomasse"
                    type="number"
                    value={affaire.augmentationBiomasse * 100}
                    onChange={(e) =>
                      setAffaire({
                        ...affaire,
                        augmentationBiomasse: parseFloat(e.target.value) / 100,
                      })
                    }
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              type="button"
              onClick={() => router.push('/affaires')}
              disabled={isLoading}
              className="px-6 py-2 bg-gray-400 text-white hover:bg-gray-500"
            >
              ← Annuler
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2 font-semibold flex-1 sm:flex-none bg-green-600 text-white hover:bg-green-700"
            >
              {isLoading ? 'Création...' : '✓ Créer l\'affaire et passer aux bâtiments'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
