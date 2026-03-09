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

export default function Home() {
  const [affaires, setAffaires] = useState<Affaire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAffaires = async () => {
      try {
        const response = await fetch('/api/affaires');
        if (response.ok) {
          const data = await response.json();
          // Prendre les 3 dernières
          setAffaires((Array.isArray(data) ? data : []).slice(0, 3));
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAffaires();
  }, []);

  const statusLabels: Record<string, { icon: string; label: string; color: string }> = {
    BROUILLON: { icon: '📝', label: 'Brouillon', color: 'bg-yellow-100 text-yellow-800' },
    EN_COURS: { icon: '🔄', label: 'En cours', color: 'bg-blue-100 text-blue-800' },
    TERMINE: { icon: '✅', label: 'Terminée', color: 'bg-green-100 text-green-800' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Section intro */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Faisabilité Biomasse
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Analyse technico-économique pour vos projets de chauffage biomasse
          </p>

          <Link href="/affaires/new">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
              <span>+ Créer une nouvelle étude</span>
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

        {/* Section actions rapides */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/affaires">
            <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Mes Affaires</h3>
              <p className="text-sm text-gray-600">Gérez toutes vos études avec filtres et tri</p>
            </div>
          </Link>

          <Link href="/couts">
            <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Coûts</h3>
              <p className="text-sm text-gray-600">Gestion de la base de coûts</p>
            </div>
          </Link>

          <Link href="/affaires/new">
            <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-semibold text-gray-900 mb-2">Nouvelle</h3>
              <p className="text-sm text-gray-600">Commencer une nouvelle étude</p>
            </div>
          </Link>
        </div>

        {/* Section dernières études */}
        {!loading && affaires.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🕐 3 dernières études
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {affaires.map((affaire) => {
                const status = statusLabels[affaire.statut] || statusLabels.BROUILLON;
                return (
                  <Link
                    key={affaire.id}
                    href={`/affaires/${affaire.id}/resultats`}
                  >
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
                          {new Date(affaire.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        <div className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium text-sm">
                          <span>Ouvrir</span>
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
              })}
            </div>
          </div>
        )}

        {!loading && affaires.length === 0 && (
          <Card className="text-center py-16 bg-white">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg text-gray-600 mb-4">
              Aucune étude pour le moment
            </p>
            <p className="text-gray-500 mb-6">
              Créez votre première étude de faisabilité
            </p>
            <Link href="/affaires/new">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Commencer
              </button>
            </Link>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            © 2025 Faisabilité Biomasse
          </p>
        </div>
      </footer>
    </div>
  );
}
