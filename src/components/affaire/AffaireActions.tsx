'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Layout';

interface AffaireActionsProps {
  affaireId: string;
  affaireRef: string;
  currentStatus?: string;
  onStatusChange?: (status: string) => Promise<void>;
  onDuplicate?: (affaireId: string) => Promise<void>;
  onExport?: () => void;
}

export function AffaireActions({ affaireId, currentStatus = 'BROUILLON', onStatusChange, onDuplicate, onExport }: AffaireActionsProps) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDuplicate = async () => {
    if (!onDuplicate) return;

    setError('');
    setSuccess('');
    setIsDuplicating(true);

    try {
      await onDuplicate(affaireId);
      setSuccess('Projet dupliqué avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la duplication du projet');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || newStatus === currentStatus) return;

    setError('');
    setSuccess('');
    setIsChangingStatus(true);

    try {
      await onStatusChange(newStatus);
      const statusLabel = { BROUILLON: 'Brouillon', EN_COURS: 'En cours', TERMINE: 'Terminée' }[newStatus] || newStatus;
      setSuccess(`Statut changé en "${statusLabel}"`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors du changement de statut');
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <Alert type="error" className="text-sm">{error}</Alert>}
      {success && <Alert type="success" className="text-sm">{success}</Alert>}
      
      <div className="flex gap-2 flex-wrap">
        {onStatusChange && (
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isChangingStatus}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="BROUILLON">📝 Brouillon</option>
            <option value="EN_COURS">🔄 En cours</option>
            <option value="TERMINE">✅ Terminée</option>
          </select>
        )}

        <Button
          variant="secondary"
          onClick={handleDuplicate}
          loading={isDuplicating}
          className="text-sm"
        >
          📋 Dupliquer
        </Button>
        
        {onExport && (
          <Button
            variant="secondary"
            onClick={onExport}
            className="text-sm"
          >
            📄 Exporter
          </Button>
        )}
      </div>
    </div>
  );
}
