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

const DEFAULT_CATEGORIES = [
  'ISOLATION',
  'EQUIPEMENTS',
  'VRD',
  'GROS_OEUVRE',
  'CHAUFFERIE_BIOMASSE',
  'CHAUFFAGE_BATIMENTS',
];

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
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
  const [newCategoryMode, setNewCategoryMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    categorie: '',
    customCategorie: '',
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

    const categorie = newCategoryMode ? formData.customCategorie.trim().toUpperCase().replace(/\s+/g, '_') : formData.categorie;
    if (!categorie || !formData.designation || !formData.unite || !formData.prixUnitaire) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    try {
      const payload = { categorie, designation: formData.designation, unite: formData.unite, prixUnitaire: parseFloat(formData.prixUnitaire) };
      if (editingId) {
        const res = await fetch('/api/costs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error('Erreur lors de la modification');
        setEditingId(null);
      } else {
        const res = await fetch('/api/costs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Erreur lors de l\'ajout');
      }
      await tryLoadCouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }

    setFormData({ categorie: '', customCategorie: '', designation: '', unite: '', prixUnitaire: '' });
    setNewCategoryMode(false);
    setIsAdding(false);
  };

  const handleEdit = (cout: Cout) => {
    setFormData({
      categorie: cout.categorie,
      customCategorie: '',
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
    setFormData({ categorie: '', customCategorie: '', designation: '', unite: '', prixUnitaire: '' });
    setNewCategoryMode(false);
    setError('');
  };

  // Build dynamic categories from existing data + defaults
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...couts.map(c => c.categorie)])];
  const CATEGORY_LABELS: Record<string, string> = { ...DEFAULT_CATEGORY_LABELS };
  // For custom categories, use a readable label
  allCategories.forEach(cat => {
    if (!CATEGORY_LABELS[cat]) {
      CATEGORY_LABELS[cat] = cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  });

  // Group and filter couts
  const categorizedCouts = allCategories.reduce((acc, cat) => {
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Coûts</h1>
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
                  {newCategoryMode ? (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Nom de la nouvelle catégorie"
                        value={formData.customCategorie}
                        onChange={(e) => setFormData({ ...formData, customCategorie: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => { setNewCategoryMode(false); setFormData({ ...formData, customCategorie: '' }); }}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={formData.categorie}
                        onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={!newCategoryMode}
                      >
                        <option value="">Sélectionner</option>
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setNewCategoryMode(true)}
                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
                        title="Créer une nouvelle catégorie"
                      >
                        + Nouvelle
                      </button>
                    </div>
                  )}
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
              {allCategories.filter(cat => couts.some(c => c.categorie === cat)).map(cat => (
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
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 mb-4">Aucun coût défini</p>
            <Button variant="primary" onClick={() => setIsAdding(true)}>Ajouter un premier coût</Button>
          </div>
        ) : Object.keys(categorizedCouts).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">Aucun coût ne correspond à cette catégorie</p>
          </div>
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
    </div>
  );
}
