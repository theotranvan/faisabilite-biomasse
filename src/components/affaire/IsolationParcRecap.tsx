'use client';

import React from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader } from '@/components/ui/Layout';
import {
  calculerIsolationParc,
  LigneIsolation,
  BatimentIsolationRecap,
} from '@/lib/calculs';

interface BatimentWithIsolation {
  id: string;
  numero: number;
  designation: string;
  travauxIsolation?: {
    lignes: LigneIsolation[];
  } | null;
}

interface IsolationParcRecapProps {
  parcNumero: number;
  batiments: BatimentWithIsolation[];
  onEditBatiment?: (batimentId: string, batimentNumero: number, batimentDesignation: string) => void;
}

export function IsolationParcRecap({
  parcNumero,
  batiments,
  onEditBatiment,
}: IsolationParcRecapProps) {
  // Préparer les données pour le calcul
  const batimentsData = batiments.map((bat) => ({
    numero: bat.numero,
    designation: bat.designation,
    lignesIsolation: bat.travauxIsolation?.lignes || [],
  }));

  const resultat = calculerIsolationParc(batimentsData);

  if (resultat.batiments.length === 0) {
    return null; // Pas de bâtiments, ne pas afficher
  }

  return (
    <Card>
      <CardHeader>
        <h4 className="text-base font-semibold text-gray-900">
          📋 Résumé isolation - Parc {parcNumero}
        </h4>
      </CardHeader>

      <div className="p-6 space-y-4">
        {/* Liste des bâtiments avec totaux */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700 bg-gray-100 p-2 rounded">
            <div className="col-span-3">Bâtiment</div>
            <div className="col-span-2 text-right">Total (€)</div>
            <div className="col-span-2 text-right">Déjà réalisé (€)</div>
            <div className="col-span-2 text-right">Reste à réaliser (€)</div>
            <div className="col-span-3 text-center">Action</div>
          </div>

          {resultat.batiments.map((bat: BatimentIsolationRecap) => (
            <div
              key={bat.numero}
              className="grid grid-cols-12 gap-2 text-sm items-center p-2 border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="col-span-3">
                <p className="font-medium">Bât {bat.numero}</p>
                <p className="text-xs text-gray-600">{bat.designation}</p>
              </div>
              <div className="col-span-2 text-right font-semibold">
                {bat.totalIsolation.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="col-span-2 text-right">
                {bat.dejaRealise.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="col-span-2 text-right font-semibold text-green-600">
                {bat.resteARealiser.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="col-span-3 text-center">
                {onEditBatiment && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onEditBatiment(
                        batiments.find((b) => b.numero === bat.numero)?.id || '',
                        bat.numero,
                        bat.designation
                      )
                    }
                  >
                    ✏️ Modifier
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sous-totaux parc */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-amber-50 rounded border border-amber-200 mt-4">
          <div>
            <p className="text-xs text-gray-600">Sous-total isolation</p>
            <p className="text-lg font-bold text-amber-600">
              {resultat.sousTotalIsolation.toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              €
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total déjà réalisé</p>
            <p className="text-lg font-bold text-gray-700">
              {resultat.totalDejaRealise.toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              €
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Reste à réaliser</p>
            <p className="text-lg font-bold text-green-600">
              {resultat.resteARealiser.toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              €
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
