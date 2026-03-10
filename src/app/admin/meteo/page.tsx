'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Form';

export default function AdminMeteoPage() {
  const [villes, setVilles] = useState<string[]>([]);
  const [djuStatus, setDjuStatus] = useState('');
  const [monotoneStatus, setMonotoneStatus] = useState('');
  const [isLoadingDju, setIsLoadingDju] = useState(false);
  const [isLoadingMonotone, setIsLoadingMonotone] = useState(false);

  useEffect(() => {
    fetch('/api/admin/meteo/villes')
      .then(r => r.json())
      .then(setVilles)
      .catch(() => {});
  }, []);

  const handleImportDJU = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDjuStatus('');
    setIsLoadingDju(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const res = await fetch('/api/admin/meteo/dju-import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setDjuStatus(`Import réussi : ${data.count} départements importés`);
        form.reset();
      } else {
        setDjuStatus(`Erreur : ${data.error}`);
      }
    } catch {
      setDjuStatus('Erreur réseau');
    } finally {
      setIsLoadingDju(false);
    }
  };

  const handleImportVille = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMonotoneStatus('');
    setIsLoadingMonotone(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const res = await fetch('/api/admin/meteo/monotone-import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMonotoneStatus(`Import réussi : ${data.ville} — ${data.heures} heures`);
        setVilles(prev => [...new Set([...prev, data.ville])].sort());
        form.reset();
      } else {
        setMonotoneStatus(`Erreur : ${data.error}`);
      }
    } catch {
      setMonotoneStatus('Erreur réseau');
    } finally {
      setIsLoadingMonotone(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Administration Météo</h1>

        {/* DJU Import */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">DJU par département</h3>
            <p className="text-sm text-gray-600 mt-1">
              Importez les DJU annuels par département. La moyenne est recalculée automatiquement.
            </p>
          </CardHeader>
          <div className="p-6">
            <form onSubmit={handleImportDJU} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                  <input
                    type="number"
                    name="annee"
                    placeholder="Ex: 2024"
                    required
                    min="1990"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fichier CSV</label>
                  <input
                    type="file"
                    name="file"
                    accept=".csv"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Format CSV attendu : 2 colonnes &quot;departement,dju&quot; (ex: &quot;AIN,2341.8&quot;)
              </p>
              <Button type="submit" disabled={isLoadingDju}>
                {isLoadingDju ? 'Import en cours...' : 'Importer les DJU'}
              </Button>
              {djuStatus && (
                <p className={`text-sm ${djuStatus.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>
                  {djuStatus}
                </p>
              )}
            </form>
          </div>
        </Card>

        {/* Monotone Import */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Villes monotone (températures horaires)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Importez 8760 températures horaires pour une ville.
            </p>
          </CardHeader>
          <div className="p-6 space-y-4">
            {/* Existing cities */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Villes disponibles :</h4>
              <div className="flex gap-2 flex-wrap">
                {villes.length === 0 && <span className="text-sm text-gray-400">Aucune ville</span>}
                {villes.map(v => (
                  <span key={v} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleImportVille} className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la ville</label>
                  <input
                    type="text"
                    name="ville"
                    placeholder="Ex: Toulouse"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fichier CSV</label>
                  <input
                    type="file"
                    name="file"
                    accept=".csv"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Format CSV : 1 colonne avec 8760 températures horaires (°C), une par ligne
              </p>
              <Button type="submit" disabled={isLoadingMonotone}>
                {isLoadingMonotone ? 'Import en cours...' : 'Ajouter la ville'}
              </Button>
              {monotoneStatus && (
                <p className={`text-sm ${monotoneStatus.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>
                  {monotoneStatus}
                </p>
              )}
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
