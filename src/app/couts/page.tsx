'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/shared/Header';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { Button, Input } from '@/components/ui/Form';

interface Cout {
  id: string;
  categorie: string;
  designation: string;
  unite: string;
  prixUnitaire: number;
  createdAt: string;
}

const CATEGORIES = [
  'ISOLATION',
  'EQUIPEMENTS',
  'VRD',
  'GROS_OEUVRE',
  'CHAUFFERIE_BIOMASSE',
  'CHAUFFAGE_BATIMENTS',
];

const CATEGORY_LABELS: Record<string, string> = {
  ISOLATION: 'Isolation',
  EQUIPEMENTS: 'Équipements',
  VRD: 'VRD',
  GROS_OEUVRE: 'Gros Œuvre',
  CHAUFFERIE_BIOMASSE: 'Chaufferie Biomasse',
  CHAUFFAGE_BATIMENTS: 'Chauffage Bâtiments',
};

export default function CoutsPage() {
  const [couts, setCouts] = useState<Cout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategorie, setFilterCategorie] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    categorie: '',
    designation: '',
    unite: '',
    prixUnitaire: '',
  });

  useEffect(() => {
    tryLoadCouts();
  }, []);

  const tryLoadCouts = async () => {
    try {
      const response = await fetch('/api/costs');
      if (response.ok) {
        const data = await response.json();
        setCouts(Array.isArray(data) ? data : []);
      } else {
        setCouts([]);
      }
    } catch {
      setCouts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.categorie || !formData.designation || !formData.unite || !formData.prixUnitaire) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    try {
      if (editingId) {
        const res = await fetch('/api/costs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData, prixUnitaire: parseFloat(formData.prixUnitaire) }),
        });
        if (!res.ok) throw new Error('Erreur lors de la modification');
        setEditingId(null);
      } else {
        const res = await fetch('/api/costs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, prixUnitaire: parseFloat(formData.prixUnitaire) }),
        });
        if (!res.ok) throw new Error('Erreur lors de l\'ajout');
      }
      await tryLoadCouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }

    setFormData({ categorie: '', designation: '', unite: '', prixUnitaire: '' });
    setIsAdding(false);
  };

  const handleEdit = (cout: Cout) => {
    setFormData({
      categorie: cout.categorie,
      designation: cout.designation,
      unite: cout.unite,
      prixUnitaire: cout.prixUnitaire.toString(),
    });
    setEditingId(cout.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce coût ?')) {
      try {
        const res = await fetch('/api/costs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error('Erreur lors de la suppression');
        await tryLoadCouts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de suppression');
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ categorie: '', designation: '', unite: '', prixUnitaire: '' });
    setError('');
  };

  // Group and filter couts
  const categorizedCouts = CATEGORIES.reduce((acc, cat) => {
    const items = couts.filter(c => c.categorie === cat);
    if (items.length > 0 && (!filterCategorie || filterCategorie === cat)) {
      acc[cat] = items;
    }
    return acc;
  }, {} as Record<string, Cout[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Coûts</h1>
            <p className="text-gray-600">Organisez votre base de prix unitaires</p>
          </div>
          {!isAdding && (
            <Button variant="primary" onClick={() => setIsAdding(true)}>
              + Ajouter un coût
            </Button>
          )}
        </div>

        {error && <Alert type="error" className="mb-6">{error}</Alert>}

        {/* Form d'ajout/édition */}
        {isAdding && (
          <Card className="mb-8 bg-blue-50 border border-blue-200">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Modifier' : 'Ajouter'} un coût
              </h2>
            </CardHeader>
            <form onSubmit={handleAddOrUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Désignation
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Isolation thermique - murs"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: m², ml, U, l, kg..."
                    value={formData.unite}
                    onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix unitaire (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData({ ...formData, prixUnitaire: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="primary" type="submit">
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button variant="secondary" type="button" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter */}
        {Object.keys(categorizedCouts).length > 1 && (
          <div className="mb-6">
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Toutes les catégories</option>
              {CATEGORIES.filter(cat => couts.some(c => c.categorie === cat)).map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : couts.length === 0 ? (
          <Card className="text-center py-16 bg-white">
            <div className="space-y-4">
              <div className="text-6xl">💰</div>
              <p className="text-lg text-gray-600">Aucun coût défini pour le moment</p>
              <p className="text-gray-500">Commencez par ajouter vos premiers coûts unitaires</p>
              <Button variant="primary" onClick={() => setIsAdding(true)} className="mt-6">
                Ajouter un premier coût
              </Button>
            </div>
          </Card>
        ) : Object.keys(categorizedCouts).length === 0 ? (
          <Card className="text-center py-16 bg-white">
            <p className="text-lg text-gray-600">Aucun coût ne correspond à cette catégorie</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(categorizedCouts).map(([categorie, items]) => (
              <Card key={categorie} className="bg-white">
                <CardHeader className="border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">{CATEGORY_LABELS[categorie] || categorie}</h2>
                  <p className="text-sm text-gray-600 mt-1">{items.length} coût(s)</p>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Désignation</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Unité</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-700">Prix unitaire</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((cout) => (
                        <tr key={cout.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">{cout.designation}</td>
                          <td className="px-6 py-4 text-gray-600 font-mono">{cout.unite}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">
                            {cout.prixUnitaire.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEdit(cout)}
                                className="px-3 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                              >
                                ✏️ Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(cout.id)}
                                className="px-3 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                              >
                                🗑️ Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 Faisabilité Biomasse</p>
        </div>
      </footer>
    </div>
  );
}
