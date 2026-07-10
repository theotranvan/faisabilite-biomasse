'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { calculConsoInitialeCalculee, calculEcartConsoPct } from '@/lib/calculs';

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
    // Chiffrages par numéro de parc (validation multi-parc)
    chiffrageRefByParc?: Record<number, any>;
    chiffrageBioByParc?: Record<number, any>;
    meteo?: { djuRetenu: number; tempIntBase: number; tempExtBase: number };
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
        if (!bat.surfaceChauffee || bat.surfaceChauffee <= 0) {
          errors.push(`Bâtiment ${idx + 1}: Surface invalide`);
        }
        if (!bat.typeEnergie) {
          errors.push(`Bâtiment ${idx + 1}: Type d'énergie non défini`);
        }

        // Comparatif conso calculée / réelle : un écart > 20 % signale des
        // déperditions, des rendements ou un relevé de factures à revérifier.
        const meteo = data?.meteo;
        if (meteo && bat.consommationsReelles > 0) {
          const calc = calculConsoInitialeCalculee(
            {
              deperditions_kW: bat.deperditions || 0,
              rendementProduction: bat.rendementProduction || 0,
              rendementDistribution: bat.rendementDistribution || 0,
              rendementEmission: bat.rendementEmission || 0,
              rendementRegulation: bat.rendementRegulation || 0,
              coefIntermittence: bat.coefIntermittence || 1,
              consommationsCalculees: 0,
              typeEnergie: bat.typeEnergie || '',
              tarification: 0,
              abonnement: 0,
            },
            meteo.djuRetenu, meteo.tempIntBase, meteo.tempExtBase
          );
          const ecart = calc > 0 ? calculEcartConsoPct(bat.consommationsReelles, calc) : null;
          if (ecart !== null && Math.abs(ecart) > 0.2) {
            warnings.push(
              `Bâtiment ${idx + 1} (${bat.designation || '?'}) : écart de ${(ecart * 100).toFixed(0)} % entre consommation réelle (${Math.round(bat.consommationsReelles).toLocaleString('fr-FR')} kWh) et calculée (${calc.toLocaleString('fr-FR')} kWh) — vérifier déperditions, rendements ou factures`
            );
          }
        } else if (meteo && (!bat.consommationsReelles || bat.consommationsReelles <= 0)) {
          warnings.push(`Bâtiment ${idx + 1} (${bat.designation || '?'}) : consommation réelle (factures) non saisie — le comparatif calculée/réelle et le DPE ne pourront pas être établis`);
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

    // Validation des chiffrages — pour CHAQUE parc (pas seulement le parc 1)
    const refMap = data?.chiffrageRefByParc || {};
    const bioMap = data?.chiffrageBioByParc || {};
    const isFilled = (o: any) => o && Object.keys(o).length > 0;
    const parcNums = (data?.parcs && data.parcs.length > 0)
      ? data.parcs.map((p: any) => p.numero)
      : [1];

    for (const num of parcNums) {
      if (!isFilled(refMap[num])) {
        warnings.push(`Parc ${num} : chiffrage de référence non complet`);
      }
      const bio = bioMap[num];
      if (!isFilled(bio)) {
        warnings.push(`Parc ${num} : chiffrage biomasse non complet`);
      } else {
        // Tolère les deux jeux de noms (schéma BDD ET formulaire)
        const totalInvestment =
          (bio.vrd || 0) +
          (bio.grosOeuvre || 0) +
          (bio.charpenteCouverture || bio.charpente || 0) +
          (bio.processBois || 0) +
          (bio.chaudiereAppoint || bio.chaudierAppoint || 0) +
          (bio.hydrauliqueChaufferie || bio.hydraulique || 0) +
          (bio.sousStation || 0) +
          (bio.installationReseau || bio.installationReseauBat || 0) +
          (bio.autresTravaux || bio.autreTravaux || 0);

        if (totalInvestment <= 0) {
          errors.push(`Parc ${num} : l'investissement biomasse doit être positif`);
        }
      }
    }

    setValidationResult({
      isValid: errors.length === 0,
      warnings,
      errors,
    });
  };

  const refMapPct = data?.chiffrageRefByParc || {};
  const bioMapPct = data?.chiffrageBioByParc || {};
  const filledPct = (o: any) => o && Object.keys(o).length > 0;
  const parcNumsPct = (data?.parcs && data.parcs.length > 0)
    ? data.parcs.map((p: any) => p.numero)
    : [1];
  const allRefDone = parcNumsPct.length > 0 && parcNumsPct.every((n: number) => filledPct(refMapPct[n]));
  const allBioDone = parcNumsPct.length > 0 && parcNumsPct.every((n: number) => filledPct(bioMapPct[n]));

  const completionPercentage = Math.round(
    (
      ((data?.batiments?.length || 0) > 0 ? 25 : 0) +
      ((data?.parcs?.length || 0) > 0 ? 25 : 0) +
      (allRefDone ? 25 : 0) +
      (allBioDone ? 25 : 0)
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

      {/* Validation Status — 3 états : erreurs / valide avec réserves / pleinement valide */}
      {!validationResult.isValid ? (
        <Alert type="error">
          ❌ Le projet contient des erreurs. Veuillez les corriger avant d'exporter.
        </Alert>
      ) : validationResult.warnings.length > 0 ? (
        <Alert type="warning">
          ✅ Le projet est analysable — quelques points optionnels restent à compléter (voir avertissements ci-dessous).
        </Alert>
      ) : (
        <Alert type="success">
          ✅ Le projet est complet et prêt pour l'analyse
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
              checked={allRefDone}
              disabled
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-800">Chiffrage référence complété (tous les parcs)</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allBioDone}
              disabled
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-800">Chiffrage biomasse complété (tous les parcs)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
