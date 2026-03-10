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

export default function AffairesPage() {
  const [affaires, setAffaires] = useState<Affaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent');
  const [filterStatus, setFilterStatus] = useState<'tous' | 'BROUILLON' | 'EN_COURS' | 'TERMINE'>('tous');

  useEffect(() => {
    const loadAffaires = async () => {
      try {
        const response = await fetch('/api/affaires');
        if (response.ok) {
          const data = await response.json();
          setAffaires(Array.isArray(data) ? data : []);
        }
      } catch {
        // Network error - affaires list will remain empty
        // User will see "Aucune étude créée" message
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

  const statusLabels: Record<string, { icon: string; label: string; color: string }> = {
    BROUILLON: { icon: '📝', label: 'Brouillon', color: 'bg-yellow-100 text-yellow-800' },
    EN_COURS: { icon: '🔄', label: 'En cours', color: 'bg-blue-100 text-blue-800' },
    TERMINE: { icon: '✅', label: 'Terminée', color: 'bg-green-100 text-green-800' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Affaires</h1>
          <Link href="/affaires/new">
            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
              + Nouvelle étude
            </button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="🔍 Chercher par nom du client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filter and Sort Controls */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="tous">Tous les statuts</option>
              <option value="BROUILLON">📝 Brouillons</option>
              <option value="EN_COURS">🔄 En cours</option>
              <option value="TERMINE">✅ Terminées</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'recent' ? 'ancien' : 'recent')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium"
            >
              {sortOrder === 'recent' ? '📅 Plus récent' : '📅 Plus ancien'}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : filteredAffaires.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{searchTerm || filterStatus !== 'tous' ? 'Aucune affaire ne correspond' : 'Aucune affaire pour le moment'}</p>
            <Link href="/affaires/new">
              <button className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                Créer une étude
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Ville</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAffaires.map((a) => {
                  const status = statusLabels[a.statut] || statusLabels.BROUILLON;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.nomClient}</td>
                      <td className="px-4 py-3 text-gray-600">{a.ville}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/affaires/${a.id}`} className="text-blue-600 hover:underline font-medium">
                          Ouvrir &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
