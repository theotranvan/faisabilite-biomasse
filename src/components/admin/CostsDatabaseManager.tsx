'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface Cost {
  id: string;
  type?: string;
  description: string;
  montantUnitaire?: number;
  unite: string;
  source?: string;
  categorie?: string;
  designation?: string;
  prixUnitaire?: number;
}

export function CostsDatabaseManager() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCost, setNewCost] = useState({
    type: 'INSTALLATION',
    description: '',
    montantUnitaire: 0,
    unite: 'FORFAIT',
  });

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const response = await fetch('/api/costs');
      if (!response.ok) throw new Error('Failed to fetch costs');
      const data = await response.json();
      setCosts(data);
    } catch (err) {
      setError('Erreur lors du chargement des coûts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.montantUnitaire) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCost),
      });

      if (!response.ok) throw new Error('Failed to add cost');
      
      await fetchCosts();
      setNewCost({ type: 'INSTALLATION', description: '', montantUnitaire: 0, unite: 'FORFAIT' });
      setIsAdding(false);
    } catch (err) {
      setError('Erreur lors de l\'ajout du coût');
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      const response = await fetch('/api/costs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete cost');
      await fetchCosts();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return <Alert type="info">Chargement...</Alert>;
  }

  const costsByType = costs.reduce((acc, cost) => {
    const type = cost.type || 'Autre';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cost);
    return acc;
  }, {} as Record<string, Cost[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Ajouter un coût de référence</h2>
        </CardHeader>
        {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de coût"
              value={newCost.type}
              onChange={(e) => setNewCost({ ...newCost, type: e.target.value })}
              options={[
                { value: 'INSTALLATION', label: 'Installation' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'EXPLOITATION', label: 'Exploitation' },
              ]}
            />
            <Input
              label="Montant unitaire (€)"
              type="number"
              step="0.01"
              value={newCost.montantUnitaire}
              onChange={(e) => setNewCost({ ...newCost, montantUnitaire: parseFloat(e.target.value) })}
            />
          </div>
          <Input
            label="Description"
            value={newCost.description}
            onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
            placeholder="Ex: Tuyauterie DN50 par mètre linéaire"
          />
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleAddCost}
              loading={isAdding}
            >
              Ajouter
            </Button>
            {isAdding && (
              <Button variant="secondary" onClick={() => setIsAdding(false)}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Costs by type */}
      {Object.entries(costsByType).map(([type, typeCosts]) => (
        <Card key={type}>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'INSTALLATION' ? '📦 Coûts d\'installation' : type === 'MAINTENANCE' ? '🔧 Maintenance' : '💰 Exploitation'}
            </h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-semibold">Description</th>
                  <th className="px-4 py-2 text-right font-semibold">Montant</th>
                  <th className="px-4 py-2 text-center font-semibold">Unité</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {typeCosts.map((cost) => (
                  <tr key={cost.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{cost.designation || cost.description}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                      {(cost.prixUnitaire ?? cost.montantUnitaire ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{cost.unite}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {costs.length === 0 && (
        <Card>
          <div className="p-6 text-center text-gray-600">
            Aucun coût de référence. Commencez par en ajouter pour votre base de données.
          </div>
        </Card>
      )}
    </div>
  );
}
