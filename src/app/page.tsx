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

  const recentAffaires = affaires.slice(0, 5);

  const statusLabels: Record<string, { label: string; color: string }> = {
    BROUILLON: { label: 'Brouillon', color: 'bg-yellow-100 text-yellow-800' },
    EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
    TERMINE: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900">Accueil</h1>
          <p className="text-gray-500 mt-1 text-sm">Vue d'ensemble de vos études de faisabilité</p>
        </div>

        {/* Quick stats */}
        {!loading && affaires.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{affaires.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brouillons</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{affaires.filter(a => a.statut === 'BROUILLON').length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">En cours</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{affaires.filter(a => a.statut === 'EN_COURS').length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terminées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{affaires.filter(a => a.statut === 'TERMINE').length}</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3 mb-8">
          <Link href="/affaires/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
            + Nouvelle étude
          </Link>
          <Link href="/affaires" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
            Toutes les affaires
          </Link>
          <Link href="/couts" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
            Base de coûts
          </Link>
        </div>

        {/* Dernières études */}
        {!loading && recentAffaires.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Études récentes</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Client</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Ville</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentAffaires.map((affaire) => {
                    const status = statusLabels[affaire.statut] || statusLabels.BROUILLON;
                    return (
                      <tr key={affaire.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{affaire.nomClient}</td>
                        <td className="px-4 py-3 text-gray-600">{affaire.ville}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(affaire.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/affaires/${affaire.id}`} className="text-blue-600 hover:underline font-medium text-sm">
                            Ouvrir &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {affaires.length > 5 && (
              <div className="mt-3 text-right">
                <Link href="/affaires" className="text-blue-600 hover:underline text-sm font-medium">
                  Voir les {affaires.length} affaires &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading && affaires.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">Aucune étude pour le moment</p>
            <Link href="/affaires/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              Créer une étude
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
