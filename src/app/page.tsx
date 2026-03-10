'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';

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

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Études de faisabilité</h1>
          <Link href="/affaires/new">
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
              + Nouvelle étude
            </button>
          </Link>
        </div>

        {/* Dernières études */}
        {!loading && affaires.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières études</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Ville</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Statut</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {affaires.map((affaire) => {
                    const status = statusLabels[affaire.statut] || statusLabels.BROUILLON;
                    return (
                      <tr key={affaire.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{affaire.nomClient}</td>
                        <td className="px-6 py-4 text-gray-600">{affaire.ville}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(affaire.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/affaires/${affaire.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                            Ouvrir →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link href="/affaires" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Voir toutes les affaires →
              </Link>
            </div>
          </div>
        )}

        {!loading && affaires.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 mb-4">Aucune étude pour le moment</p>
            <Link href="/affaires/new">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Créer une étude
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
