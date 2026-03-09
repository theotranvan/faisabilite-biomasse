'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

interface ValidationProps {
  affaireId: string;
  data?: {
    batiments?: any[];
    parcs?: any[];
    chiffrageRef?: any;
    chiffrageBio?: any;
  };
}

export function ValidationModule({ data }: Omit<ValidationProps, 'affaireId'>) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
  });

  useEffect(() => {
    validateProject();
  }, [data]);

  const validateProject = () => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validation des bâtiments
    if (!data?.batiments || data.batiments.length === 0) {
      errors.push('Au moins un bâtiment doit être défini');
    } else {
      data.batiments.forEach((bat: any, idx: number) => {
        if (!bat.surfaceEtat || bat.surfaceEtat <= 0) {
          errors.push(`Bâtiment ${idx + 1}: Surface invalide`);
        }
        if (!bat.typeEnergiePrincipal) {
          errors.push(`Bâtiment ${idx + 1}: Type d'énergie non défini`);
        }
      });
    }

    // Validation des parcs
    if (!data?.parcs || data.parcs.length === 0) {
      warnings.push('Aucun réseau de chaleur configuré');
    } else {
      data.parcs.forEach((parc: any, idx: number) => {
        if (!parc.typeBiomasse) {
          warnings.push(`Réseau ${idx + 1}: Type de biomasse non défini`);
        }
        if (!parc.puissanceChaudiereBois || parc.puissanceChaudiereBois <= 0) {
          warnings.push(`Réseau ${idx + 1}: Puissance chaudière invalide`);
        }
        if (!parc.longueurReseau || parc.longueurReseau <= 0) {
          warnings.push(`Réseau ${idx + 1}: Longueur réseau invalide`);
        }
      });
    }

    // Validation des chiffrages
    if (!data?.chiffrageRef) {
      warnings.push('Chiffrage scénario de référence non complet');
    }

    if (!data?.chiffrageBio) {
      warnings.push('Chiffrage scénario biomasse non complet');
    } else {
      const totalInvestment =
        (data.chiffrageBio.coutInstallationChaudieres || 0) +
        (data.chiffrageBio.coutInstallationReseau || 0) +
        (data.chiffrageBio.coutInstallateurLocalBois || 0);

      if (totalInvestment <= 0) {
        errors.push('Investissement total doit être positif');
      }
    }

    setValidationResult({
      isValid: errors.length === 0,
      warnings,
      errors,
    });
  };

  const completionPercentage = Math.round(
    (
      ((data?.batiments?.length || 0) > 0 ? 25 : 0) +
      ((data?.parcs?.length || 0) > 0 ? 25 : 0) +
      (data?.chiffrageRef ? 25 : 0) +
      (data?.chiffrageBio ? 25 : 0)
    ) as number
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Complétude du projet</h3>
        </CardHeader>
        <div className="p-6">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{completionPercentage}% complété</p>
        </div>
      </Card>

      {/* Validation Status */}
      {validationResult.isValid ? (
        <Alert type="success">
          ✅ Le projet est valide et prêt pour l'analyse
        </Alert>
      ) : (
        <Alert type="error">
          ❌ Le projet contient des erreurs. Veuillez les corriger avant d'exporter.
        </Alert>
      )}

      {/* Errors */}
      {validationResult.errors.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-red-600">Erreurs à corriger</h3>
          </CardHeader>
          <div className="p-6 space-y-2">
            {validationResult.errors.map((error, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="text-red-600 font-bold">⚠</span>
                <span className="text-gray-800">{error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Warnings */}
      {validationResult.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-yellow-600">Avertissements</h3>
          </CardHeader>
          <div className="p-6 space-y-2">
            {validationResult.warnings.map((warning, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="text-yellow-600 font-bold">ℹ</span>
                <span className="text-gray-800">{warning}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Checklist */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Liste de vérification</h3>
        </CardHeader>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={(data?.batiments?.length || 0) > 0}
              disabled
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-800">
              Bâtiments définis ({data?.batiments?.length || 0})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={(data?.parcs?.length || 0) > 0}
              disabled
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-800">
              Réseaux configurés ({data?.parcs?.length || 0})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!data?.chiffrageRef}
              disabled
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-800">Chiffrage référence complété</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!data?.chiffrageBio}
              disabled
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-800">Chiffrage biomasse complété</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
