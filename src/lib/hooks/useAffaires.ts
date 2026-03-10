'use client';

import { useState, useCallback, useEffect } from 'react';

export interface AffaireData {
  id: string;
  referenceAffaire: string;
  nomClient: string;
  adresse: string;
  ville: string;
  departement: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batiment {
  id: string;
  affaireId: string;
  numero: number;
  typeBuilding: string;
  surfaceEtat: number;
  volumeEtat: number;
  deperditionsEtat: number;
  typeEnergiePrincipal: string;
}

export interface Parc {
  id: string;
  affaireId: string;
  numero: number;
  typeBiomasse?: string;
  puissanceChaudiereBois?: number;
  rendementChaudiereBois?: number;
  longueurReseau?: number;
  sectionReseau?: string;
  pourcentageCouvertureBois?: number;
}

export function useAffaires() {
  const [affaires, setAffaires] = useState<AffaireData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAffaires = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/affaires', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch affaires');

      const data = await response.json();
      setAffaires(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAffaire = useCallback(
    async (affaireData: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/affaires', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(affaireData),
        });

        if (!response.ok) throw new Error('Failed to create affaire');

        const newAffaire = await response.json();
        setAffaires([newAffaire, ...affaires]);
        return newAffaire;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [affaires]
  );

  const deleteAffaire = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/affaires/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete affaire');

        setAffaires(affaires.filter((a) => a.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [affaires]
  );

  useEffect(() => {
    fetchAffaires();
  }, [fetchAffaires]);

  // Batiments management
  const fetchBatiments = useCallback(
    async (affaireId: string) => {
      try {
        const response = await fetch(`/api/affaires/${affaireId}/batiments`);
        if (!response.ok) throw new Error('Failed to fetch batiments');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      }
    },
    []
  );

  const saveBatiments = useCallback(
    async (affaireId: string, batiments: any[]) => {
      try {
        const response = await fetch(`/api/affaires/${affaireId}/batiments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batiments),
        });
        if (!response.ok) throw new Error('Failed to save batiments');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    []
  );

  // Parcs management
  const fetchParcs = useCallback(
    async (affaireId: string) => {
      try {
        const response = await fetch(`/api/affaires/${affaireId}/parcs`);
        if (!response.ok) throw new Error('Failed to fetch parcs');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return [];
      }
    },
    []
  );

  const saveParcs = useCallback(
    async (affaireId: string, parcs: any[]) => {
      try {
        const response = await fetch(`/api/affaires/${affaireId}/parcs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parcs),
        });
        if (!response.ok) throw new Error('Failed to save parcs');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    []
  );

  // Chiffrage management
  const fetchChiffrageReference = useCallback(
    async (affaireId: string, parcNum?: number) => {
      try {
        const url = parcNum != null
          ? `/api/affaires/${affaireId}/chiffrage-reference?parc=${parcNum}`
          : `/api/affaires/${affaireId}/chiffrage-reference`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chiffrage reference');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return {};
      }
    },
    []
  );

  const saveChiffrageReference = useCallback(
    async (affaireId: string, data: any, parcNum?: number) => {
      try {
        const url = parcNum != null
          ? `/api/affaires/${affaireId}/chiffrage-reference?parc=${parcNum}`
          : `/api/affaires/${affaireId}/chiffrage-reference`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to save chiffrage reference');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    []
  );

  const fetchChiffrageBiomasse = useCallback(
    async (affaireId: string, parcNum?: number) => {
      try {
        const url = parcNum != null
          ? `/api/affaires/${affaireId}/chiffrage-biomasse?parc=${parcNum}`
          : `/api/affaires/${affaireId}/chiffrage-biomasse`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chiffrage biomasse');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return {};
      }
    },
    []
  );

  const saveChiffrageBiomasse = useCallback(
    async (affaireId: string, data: any, parcNum?: number) => {
      try {
        const url = parcNum != null
          ? `/api/affaires/${affaireId}/chiffrage-biomasse?parc=${parcNum}`
          : `/api/affaires/${affaireId}/chiffrage-biomasse`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to save chiffrage biomasse');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    []
  );

  // Isolation management
  const fetchIsolation = useCallback(
    async (affaireId: string, batimentId: string) => {
      try {
        const response = await fetch(
          `/api/affaires/${affaireId}/batiments/${batimentId}/isolation`
        );
        if (!response.ok) throw new Error('Failed to fetch isolation');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return { lignes: [] };
      }
    },
    []
  );

  const saveIsolation = useCallback(
    async (affaireId: string, batimentId: string, lignes: any[]) => {
      try {
        const response = await fetch(
          `/api/affaires/${affaireId}/batiments/${batimentId}/isolation`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lignes }),
          }
        );
        if (!response.ok) throw new Error('Failed to save isolation');
        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    []
  );

  // Duplication
  const duplicateAffaire = useCallback(
    async (affaireId: string) => {
      try {
        const response = await fetch('/api/affaires/duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affaireId }),
        });
        if (!response.ok) throw new Error('Failed to duplicate affaire');
        const newAffaire = await response.json();
        setAffaires([newAffaire, ...affaires]);
        return newAffaire;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [affaires]
  );

  return {
    affaires,
    isLoading,
    error,
    fetchAffaires,
    createAffaire,
    deleteAffaire,
    fetchBatiments,
    saveBatiments,
    fetchParcs,
    saveParcs,
    fetchChiffrageReference,
    saveChiffrageReference,
    fetchChiffrageBiomasse,
    saveChiffrageBiomasse,
    fetchIsolation,
    saveIsolation,
    duplicateAffaire,
  };
}
