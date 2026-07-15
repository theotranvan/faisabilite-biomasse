'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import { LoadingScreen } from '@/components/ui/Loading';

interface Affaire {
  id: string;
  nomClient: string;
  ville: string;
  departement: string;
  createdAt: string;
  statut: string;
  derniereModification?: string;
}

// Date + heure au format français (ex : "10/07/2026 à 14:32")
const formatDerniereModification = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('fr-FR');
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} à ${heure}`;
};

interface DeleteTarget {
  id: string;
  nomClient: string;
}

export default function AffairesPage() {
  const [affaires, setAffaires] = useState<Affaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent');
  const [filterStatus, setFilterStatus] = useState<'tous' | 'BROUILLON' | 'EN_COURS' | 'TERMINE'>('tous');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  const openDeleteModal = (id: string, nomClient: string) => {
    setDeleteTarget({ id, nomClient });
    requestAnimationFrame(() => setModalVisible(true));
  };

  const closeDeleteModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setDeleteTarget(null), 300);
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    closeDeleteModal();
    try {
      const res = await fetch(`/api/affaires/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedId(deleteTarget.id);
        setTimeout(() => {
          setAffaires(prev => prev.filter(a => a.id !== deleteTarget.id));
          setDeletedId(null);
        }, 400);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setDeleting(null);
    }
  };

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
    <div className="min-h-screen bg-gray-50">
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
          <LoadingScreen message="Chargement des affaires..." />
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
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Dernière modification</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAffaires.map((a) => {
                  const status = statusLabels[a.statut] || statusLabels.BROUILLON;
                  const isBeingDeleted = deletedId === a.id;
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50 transition-all duration-400"
                      style={{
                        opacity: isBeingDeleted ? 0 : 1,
                        transform: isBeingDeleted ? 'translateX(40px)' : 'translateX(0)',
                        maxHeight: isBeingDeleted ? '0px' : '80px',
                        transition: 'opacity 0.35s ease, transform 0.35s ease, max-height 0.35s ease',
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{a.nomClient}</td>
                      <td className="px-4 py-3 text-gray-600">{a.ville}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDerniereModification(a.derniereModification)}
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-3">
                        <Link href={`/affaires/${a.id}`} className="text-blue-600 hover:underline font-medium">
                          Ouvrir &rarr;
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); openDeleteModal(a.id, a.nomClient); }}
                          disabled={deleting === a.id}
                          className="text-red-400 hover:text-red-600 text-lg px-1 py-1 rounded-md hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deleting === a.id ? (
                            <svg className="animate-spin h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeDeleteModal}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            style={{ opacity: modalVisible ? 1 : 0 }}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300"
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-600" />

            <div className="p-6">
              {/* Icon */}
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Supprimer cette affaire ?
              </h3>

              {/* Client name */}
              <p className="text-center mb-3">
                <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-medium text-gray-800">
                  {deleteTarget.nomClient}
                </span>
              </p>

              {/* Warning */}
              <p className="text-sm text-gray-500 text-center mb-6">
                Toutes les données associées seront définitivement supprimées
                <br />
                <span className="text-xs text-gray-400">(bâtiments, parcs, chiffrages, isolation)</span>
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
