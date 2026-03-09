'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';


interface HistoryEntry {
  id: string;
  action: string;
  timestamp: string;
  changedFields?: string[];
}

interface VersionHistoryProps {
  affaireId: string;
}

export function VersionHistory({ affaireId }: VersionHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading history
    const mockHistory: HistoryEntry[] = [
      {
        id: '1',
        action: 'Création du projet',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        action: 'Bâtiments ajoutés',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        changedFields: ['batiments'],
      },
      {
        id: '3',
        action: 'Réseau configuré',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        changedFields: ['parcs', 'puissanceChaudiereBois'],
      },
      {
        id: '4',
        action: 'Chiffrage actualisé',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        changedFields: ['coutInstallation', 'coutMaintenance'],
      },
    ];

    setHistory(mockHistory);
    setIsLoading(false);
  }, [affaireId]);

  if (isLoading) {
    return <Alert type="info">Chargement de l'historique...</Alert>;
  }

  const getActionIcon = (action: string) => {
    if (action.includes('Création')) return '✨';
    if (action.includes('Bâtiments')) return '🏢';
    if (action.includes('Réseau')) return '🔥';
    if (action.includes('Chiffrage')) return '💰';
    return '📝';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Historique des versions</h3>
      </CardHeader>

      <div className="p-6">
        <div className="space-y-4">
          {history.map((entry, idx) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  {getActionIcon(entry.action)}
                </div>
                {idx < history.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                )}
              </div>

              <div className="flex-1 pt-1">
                <div className="font-semibold text-gray-900">{entry.action}</div>
                <div className="text-sm text-gray-600">{formatDate(entry.timestamp)}</div>
                {entry.changedFields && entry.changedFields.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {entry.changedFields.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {history.length === 0 && (
          <div className="text-center text-gray-600 py-8">
            Aucun historique pour ce projet
          </div>
        )}
      </div>
    </Card>
  );
}
