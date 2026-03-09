'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface SharingProps {
  affaireId: string;
}

export function ProjectSharing({ affaireId }: SharingProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shares, setShares] = useState<any[]>([]);

  const handleShare = async () => {
    if (!email) {
      setError('Entrez une adresse e-mail');
      return;
    }

    setIsSharing(true);
    setError('');

    try {
      const response = await fetch('/api/affaires/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affaireId, email, role }),
      });

      if (!response.ok) throw new Error('Failed to share');

      const newShare = await response.json();
      setShares([...shares, newShare]);
      setSuccess(`Projet partagé avec ${email}`);
      setEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors du partage du projet');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await fetch('/api/affaires/share', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId }),
      });

      setShares(shares.filter(s => s.id !== shareId));
    } catch (err) {
      setError('Erreur lors de la suppression du partage');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Partager le projet</h3>
        </CardHeader>
        {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}
        {success && <Alert type="success" className="m-6 mb-0">{success}</Alert>}
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@domain.com"
              />
            </div>
            <div>
              <Select
                label="Rôle"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: 'VIEWER', label: 'Lecteur' },
                  { value: 'EDITOR', label: 'Éditeur' },
                  { value: 'ADMIN', label: 'Administrateur' },
                ]}
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleShare}
            loading={isSharing}
          >
            Partager
          </Button>
        </div>
      </Card>

      {/* Shared with list */}
      {shares.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Partagé avec</h3>
          </CardHeader>
          <div className="override-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-semibold">E-mail</th>
                  <th className="px-4 py-2 text-left font-semibold">Rôle</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((share) => (
                  <tr key={share.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{share.sharedWith}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {share.role === 'VIEWER' ? 'Lecteur' : share.role === 'EDITOR' ? 'Éditeur' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm"
                      >
                        ✕ Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
