'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import { Card, CardHeader } from '@/components/ui/Layout';

interface Affaire {
  id: string;
  nomClient: string;
  ville: string;
  departement: string;
  createdAt: string;
  statut: string;
}

export default function DashboardPage() {
  const [affaires, setAffaires] = useState<Affaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent');
  const [filterStatus, setFilterStatus] = useState<'tous' | 'brouillon' | 'en_cours' | 'termine'>('tous');

  useEffect(() => {
    const loadAffaires = async () => {
      try {
        const response = await fetch('/api/affaires');
        if (response.ok) {
          const data = await response.json();
          setAffaires(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAffaires();
  }, []);

  // Filter and sort affaires
  const filteredAffaires = affaires
    .filter(a => {
      const matchSearch = a.nomClient.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'tous' || a.statut === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

  // Separate by status
  const brouillons = filteredAffaires.filter(a => a.statut === 'BROUILLON');
  const enCours = filteredAffaires.filter(a => a.statut === 'EN_COURS');
  const terminees = filteredAffaires.filter(a => a.statut === 'TERMINE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Faisabilité Biomasse
          </h1>

          {/* CTA Button */}
          <Link href="/affaires/new">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
              <span>+ Nouvelle étude</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </Link>
        </div>

        {/* Affaires existantes */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {filteredAffaires.length === 0 ? 'Aucune étude' : 'Mes études'}
            </h2>

            {/* Filters and Search */}
            <div className="space-y-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="🔍 Chercher par nom de l'affaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Filter and Sort Controls */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="BROUILLON">Brouillons</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminées</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'recent' ? 'ancien' : 'recent')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  {sortOrder === 'recent' ? '📅 Plus récent' : '📅 Plus ancien'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : filteredAffaires.length === 0 ? (
            <Card className="text-center py-16">
              <div className="space-y-4">
                <div className="text-6xl">📋</div>
                <p className="text-lg text-gray-600">
                  {searchTerm || filterStatus !== 'tous' ? 'Aucune étude ne correspond' : 'Aucune étude créée pour le moment'}
                </p>
                <Link href="/affaires/new">
                  <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Créer une étude
                  </button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Brouillons */}
              {brouillons.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Brouillons ({brouillons.length})</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brouillons.map((affaire) => (
                      <AffaireCard key={affaire.id} affaire={affaire} />
                    ))}
                  </div>
                </div>
              )}

              {/* En cours */}
              {enCours.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🔄 En cours ({enCours.length})</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enCours.map((affaire) => (
                      <AffaireCard key={affaire.id} affaire={affaire} />
                    ))}
                  </div>
                </div>
              )}

              {/* Terminées */}
              {terminees.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">✅ Terminées ({terminees.length})</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {terminees.map((affaire) => (
                      <AffaireCard key={affaire.id} affaire={affaire} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            © 2025 Faisabilité Biomasse - Outil d'étude technico-économique
          </p>
        </div>
      </footer>
    </div>
  );
}

// Composant pour afficher une carte d'affaire
function AffaireCard({ affaire }: { affaire: Affaire }) {
  const statusLabels: Record<string, string> = {
    BROUILLON: '📝 Brouillon',
    EN_COURS: '🔄 En cours',
    TERMINE: '✅ Terminée',
  };

  return (
    <Link href={`/affaires/${affaire.id}/resultats`}>
      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow bg-white">
        <CardHeader className="border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {affaire.nomClient}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {affaire.ville} • {affaire.departement}
          </p>
        </CardHeader>
        <div className="p-4">
          <p className="text-xs text-gray-500">
            Créée le {new Date(affaire.createdAt).toLocaleDateString('fr-FR')}
          </p>
          <div className="mt-3 text-sm font-medium text-blue-600">
            {statusLabels[affaire.statut] || affaire.statut}
          </div>
          <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium text-sm">
            <span>Voir les détails</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}
