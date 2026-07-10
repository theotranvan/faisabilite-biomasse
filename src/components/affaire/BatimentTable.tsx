'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { ENERGY_TARIFS, COEF_INTERMITTENCE, TYPES_INSTALLATION } from '@/lib/enums';
import { calculConsoInitialeCalculee, calculEcartConsoPct } from '@/lib/calculs';

interface Batiment {
  id: string;
  numero: number;
  designation: string;
  typeBatiment: string;
  typeInstallation?: string;
  surfaceChauffee: number;
  volumeChauffe: number;
  parc: number;
  deperditions: number;
  rendementProduction: number;
  rendementDistribution: number;
  rendementEmission: number;
  rendementRegulation: number;
  coefIntermittence: number;
  consommationsCalculees?: number;
  consommationsReelles?: number;
  typeEnergie: string;
  tarification: number;
  abonnement: number;
  // État de référence
  refDeperditions?: number | null;
  refTypeEnergie?: string | null;
  refRendementProduction?: number | null;
  refRendementDistribution?: number | null;
  refRendementEmission?: number | null;
  refRendementRegulation?: number | null;
  refTarification?: number | null;
  refAbonnement?: number | null;
}

interface BatimentTableProps {
  affaireId: string;
  batiments: Batiment[];
  onSave: (batiments: Batiment[]) => Promise<void>;
  isLoading?: boolean;
  djuRetenu?: number;
  tempIntBase?: number;
  tempExtBase?: number;
}

const TYPES_BATIMENT = [
  { value: 'LOGEMENTS', label: 'Logements' },
  { value: 'BUREAUX', label: 'Bureaux' },
  { value: 'OCCUPATION_CONTINUE', label: 'Occupation continue' },
  { value: 'AUTRES', label: 'Autres' },
];

const TYPES_ENERGIE = [
  { value: 'FUEL', label: 'Fioul' },
  { value: 'GAZ_NATUREL', label: 'Gaz naturel' },
  { value: 'GAZ_PROPANE', label: 'Gaz propane' },
  { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'BOIS_DECHIQUETTE', label: 'Bois déchiquetté' },
];

// Écart affiché en couleur : ≤10 % vert (déperditions cohérentes avec les factures),
// ≤20 % orange, au-delà rouge (déperditions ou factures à revérifier).
function ecartBadge(ecart: number | null) {
  if (ecart === null) return null;
  const pct = ecart * 100;
  const abs = Math.abs(pct);
  const cls = abs <= 10
    ? 'bg-green-100 text-green-800 border-green-300'
    : abs <= 20
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-red-100 text-red-800 border-red-300';
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-sm font-semibold ${cls}`}>
      {pct > 0 ? '+' : ''}{pct.toFixed(1)} %
    </span>
  );
}

const fmtKwh = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export function BatimentTable({ batiments: initialBatiments, onSave, djuRetenu = 1977, tempIntBase = 19, tempExtBase = -7 }: Omit<BatimentTableProps, 'affaireId' | 'isLoading'>) {
  const [batiments, setBatiments] = useState<Batiment[]>(initialBatiments);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'etat_initial' | 'etat_ref'>('etat_initial');
  const initialBatimentsRef = useRef(JSON.stringify(initialBatiments));
  const isDirty = JSON.stringify(batiments) !== initialBatimentsRef.current;

  // Conso calculée en direct (formule Excel : coef × déperd × 24 × DJU / ((Tint−Text) × rdt moyen))
  const consoCalculee = (b: Batiment) => calculConsoInitialeCalculee(
    {
      deperditions_kW: b.deperditions || 0,
      rendementProduction: b.rendementProduction || 0,
      rendementDistribution: b.rendementDistribution || 0,
      rendementEmission: b.rendementEmission || 0,
      rendementRegulation: b.rendementRegulation || 0,
      coefIntermittence: b.coefIntermittence || 1,
      consommationsCalculees: 0,
      typeEnergie: b.typeEnergie,
      tarification: b.tarification,
      abonnement: b.abonnement,
    },
    djuRetenu, tempIntBase, tempExtBase
  );

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const addBatiment = () => {
    const newBatiment: Batiment = {
      id: `new-${Date.now()}`,
      numero: Math.max(...batiments.map(b => b.numero), 0) + 1,
      designation: 'Nouveau bâtiment',
      typeBatiment: 'LOGEMENTS',
      surfaceChauffee: 1000,
      volumeChauffe: 3000,
      parc: 1,
      deperditions: 50,
      rendementProduction: 85,
      rendementDistribution: 95,
      rendementEmission: 98,
      rendementRegulation: 97,
      coefIntermittence: 1,
      consommationsCalculees: 0,
      consommationsReelles: 0,
      typeEnergie: 'GAZ_NATUREL',
      tarification: 0.08,
      abonnement: 150,
    };
    setBatiments([...batiments, newBatiment]);
  };

  const updateBatiment = (id: string, field: string, value: any) => {
    setBatiments(batiments.map(b => {
      if (b.id !== id) return b;
      const parsedValue = field.includes('rendement') || field === 'coefIntermittence' || field === 'tarification'
        ? parseFloat(value)
        : field.includes('consommations')
        ? (parseFloat(value) || 0)
        : isNaN(value) ? value : parseFloat(value);
      const updated = { ...b, [field]: parsedValue };

      // Auto-fill tarif + abonnement when typeEnergie changes
      if (field === 'typeEnergie' && ENERGY_TARIFS[value]) {
        updated.tarification = ENERGY_TARIFS[value].tarification;
        updated.abonnement = ENERGY_TARIFS[value].abonnement;
      }

      // Auto-fill ref tarif + abonnement when refTypeEnergie changes
      if (field === 'refTypeEnergie' && value && ENERGY_TARIFS[value]) {
        updated.refTarification = ENERGY_TARIFS[value].tarification;
        updated.refAbonnement = ENERGY_TARIFS[value].abonnement;
      }

      // Auto-fill coefIntermittence when typeBatiment changes
      if (field === 'typeBatiment' && COEF_INTERMITTENCE[value] != null) {
        updated.coefIntermittence = COEF_INTERMITTENCE[value];
      }

      // Auto-fill 4 rendements when typeInstallation changes
      if (field === 'typeInstallation') {
        const preset = TYPES_INSTALLATION.find(t => t.value === value);
        if (preset) {
          updated.rendementProduction = preset.rendementProduction;
          updated.rendementDistribution = preset.rendementDistribution;
          updated.rendementEmission = preset.rendementEmission;
          updated.rendementRegulation = preset.rendementRegulation;
        }
      }

      return updated;
    }));
  };

  const deleteBatiment = (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bâtiment ? Cette action est irréversible.')) return;
    setBatiments(batiments.filter(b => b.id !== id));
  };

  const handleSave = async () => {
    setError('');
    setSuccessMsg('');
    setIsSaving(true);
    try {
      // La conso « calculée » est dérivée des déperditions (formule Excel) et
      // stockée telle quelle ; la conso « réelle » reste la saisie factures.
      // Le coût actuel utilise la calculée (comme l'Excel), le DPE/énergie
      // primaire la réelle si saisie, sinon la calculée.
      const normalises = batiments.map(b => {
        const calc = consoCalculee(b);
        const reel = b.consommationsReelles || 0;
        return {
          ...b,
          consommationsCalculees: calc || b.consommationsCalculees || reel,
          consommationsReelles: reel,
        };
      });
      setBatiments(normalises);
      await onSave(normalises);
      initialBatimentsRef.current = JSON.stringify(normalises);
      setSuccessMsg('Bâtiments enregistrés avec succès');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Bâtiments</h3>
          <Button variant="primary" size="sm" onClick={addBatiment}>
            + Ajouter bâtiment
          </Button>
        </div>
      </CardHeader>

      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}
      {successMsg && <Alert type="success" className="m-6 mb-0">{successMsg}</Alert>}
      {isDirty && <div className="mx-6 mt-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">⚠️ Modifications non sauvegardées</div>}

      <div className="p-6 space-y-6">
        {/* Message vide */}
        {batiments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-lg text-gray-600 mb-4">Aucun bâtiment pour le moment</p>
            <p className="text-gray-500 mb-6">Commencez par ajouter le premier bâtiment à votre étude</p>
            <Button variant="primary" onClick={addBatiment}>
              + Ajouter le premier bâtiment
            </Button>
          </div>
        ) : (
          <>
            {/* Onglets */}
            <div className="flex gap-4 border-b border-gray-200 pb-4">
              <button
                onClick={() => setActiveTab('etat_initial')}
                className={`px-4 py-2 font-semibold transition ${activeTab === 'etat_initial' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              >
                État initial
              </button>
              <button
                onClick={() => {
                  // Copier les valeurs initiales vers les champs ref s'ils sont null
                  setBatiments(prev => prev.map(b => ({
                    ...b,
                    refDeperditions: b.refDeperditions ?? b.deperditions,
                    refTypeEnergie: b.refTypeEnergie ?? b.typeEnergie,
                    refRendementProduction: b.refRendementProduction ?? b.rendementProduction,
                    refRendementDistribution: b.refRendementDistribution ?? b.rendementDistribution,
                    refRendementEmission: b.refRendementEmission ?? b.rendementEmission,
                    refRendementRegulation: b.refRendementRegulation ?? b.rendementRegulation,
                    refTarification: b.refTarification ?? b.tarification,
                    refAbonnement: b.refAbonnement ?? b.abonnement,
                  })));
                  setActiveTab('etat_ref');
                }}
                className={`px-4 py-2 font-semibold transition ${activeTab === 'etat_ref' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              >
                État de référence
              </button>
            </div>

            {/* Tableau éditable */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">N°</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Désignation</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Parc</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Surface (m²)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Volume (m³)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Déperditions (kW)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Type énergie</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batiments.map((batiment) => (
                    <tr key={batiment.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 font-mono">{batiment.numero}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={batiment.designation}
                          onChange={(e) => updateBatiment(batiment.id, 'designation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={batiment.typeBatiment}
                          onChange={(e) => updateBatiment(batiment.id, 'typeBatiment', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {TYPES_BATIMENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={String(batiment.parc || 1)}
                          onChange={(e) => updateBatiment(batiment.id, 'parc', parseInt(e.target.value))}
                          className="min-w-[80px] px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="1">Parc 1</option>
                          <option value="2">Parc 2</option>
                          <option value="3">Parc 3</option>
                          <option value="4">Parc 4</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={batiment.surfaceChauffee}
                          onChange={(e) => updateBatiment(batiment.id, 'surfaceChauffee', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={batiment.volumeChauffe}
                          onChange={(e) => updateBatiment(batiment.id, 'volumeChauffe', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={batiment.deperditions}
                          onChange={(e) => updateBatiment(batiment.id, 'deperditions', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={batiment.typeEnergie}
                          onChange={(e) => updateBatiment(batiment.id, 'typeEnergie', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {TYPES_ENERGIE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => deleteBatiment(batiment.id)}
                          className="px-3 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Détails rendements par bâtiment - État initial */}
            {activeTab === 'etat_initial' && (
              <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">Rendements et tarifs par bâtiment (état initial)</p>
                {batiments.map((batiment) => (
                  <div key={batiment.id} className="mb-4 p-4 bg-white rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">{batiment.designation}</h4>
                    {/* Type d'installation → pré-remplit les 4 rendements */}
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;installation chauffage</label>
                      <select
                        value={batiment.typeInstallation || ''}
                        onChange={(e) => updateBatiment(batiment.id, 'typeInstallation', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Sélectionner pour pré-remplir les rendements...</option>
                        {TYPES_INSTALLATION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <p className="text-xs text-gray-500 mt-1 italic">💡 Sélectionnez un type de chaudière pour pré-remplir les rendements. Vous pouvez ensuite les ajuster.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt production (%)</label>
                        <input type="number" step="1" min="0" max="110" value={batiment.rendementProduction}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementProduction', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt distribution (%)</label>
                        <input type="number" step="1" min="0" max="100" value={batiment.rendementDistribution}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementDistribution', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt émission (%)</label>
                        <input type="number" step="1" min="0" max="100" value={batiment.rendementEmission}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementEmission', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt régulation (%)</label>
                        <input type="number" step="1" min="0" max="100" value={batiment.rendementRegulation}
                          onChange={(e) => updateBatiment(batiment.id, 'rendementRegulation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Coef intermittence</label>
                        <input type="number" step="0.01" min="0" max="2" value={batiment.coefIntermittence}
                          onChange={(e) => updateBatiment(batiment.id, 'coefIntermittence', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Tarification (€/kWh)</label>
                        <input type="number" step="0.001" value={batiment.tarification}
                          onChange={(e) => updateBatiment(batiment.id, 'tarification', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Abonnement (€/an)</label>
                        <input type="number" value={batiment.abonnement}
                          onChange={(e) => updateBatiment(batiment.id, 'abonnement', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                    </div>

                    {/* Consommations : calculée (dérivée des déperditions, formule Excel) vs
                        réelle (factures), avec l'écart — comme le formulaire « état initial »
                        de l'Excel. La calculée alimente le coût actuel, la réelle le DPE. */}
                    {(() => {
                      const calc = consoCalculee(batiment);
                      const ecart = calculEcartConsoPct(batiment.consommationsReelles, calc);
                      return (
                        <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">⚡ Consommations annuelles (état initial)</label>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <label className="block text-gray-600 mb-1">Consommations calculées (kWh/an)</label>
                              <div className="w-full px-2 py-1 border border-gray-200 rounded bg-gray-50 font-semibold text-gray-900">
                                {calc > 0 ? fmtKwh(calc) : '—'}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Déperditions × 24 × DJU ({fmtKwh(djuRetenu)}) / ((Tint − Text) × rendement moyen)
                              </p>
                            </div>
                            <div>
                              <label className="block text-gray-600 mb-1">Consommations réelles (kWh/an) — factures</label>
                              <input type="number" min="0" step="100"
                                value={batiment.consommationsReelles ?? 0}
                                onChange={(e) => updateBatiment(batiment.id, 'consommationsReelles', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="ex : 240000" />
                            </div>
                            <div>
                              <label className="block text-gray-600 mb-1">Écart réelles / calculées</label>
                              <div className="py-1">
                                {ecart !== null ? ecartBadge(ecart) : <span className="text-gray-400 text-sm italic">Saisir les réelles</span>}
                              </div>
                            </div>
                          </div>
                          {ecart !== null && Math.abs(ecart) > 0.2 && (
                            <p className="text-xs text-red-600 mt-2">
                              ⚠️ Écart supérieur à 20 % : vérifiez les déperditions, les rendements ou le relevé de factures.
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2 italic">
                            💡 La consommation calculée sert au coût de la situation actuelle ; la consommation réelle
                            (factures) sert à l&apos;étiquette DPE et au contrôle de cohérence des déperditions.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ))}

                {/* Comparatif consommations calculées / réelles (tous bâtiments) */}
                <div className="mt-2 p-4 bg-white rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">📊 Comparatif consommations calculées / réelles</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300 text-gray-700">
                        <th className="text-left py-2 px-2">Bâtiment</th>
                        <th className="text-right py-2 px-2">Conso calculée (kWh/an)</th>
                        <th className="text-right py-2 px-2">Conso réelle (kWh/an)</th>
                        <th className="text-right py-2 px-2">Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batiments.map(b => {
                        const calc = consoCalculee(b);
                        const reel = b.consommationsReelles || 0;
                        const ecart = calculEcartConsoPct(reel, calc);
                        return (
                          <tr key={b.id} className="border-b border-gray-200">
                            <td className="py-2 px-2">{b.designation}</td>
                            <td className="text-right py-2 px-2">{calc > 0 ? fmtKwh(calc) : '—'}</td>
                            <td className="text-right py-2 px-2">{reel > 0 ? fmtKwh(reel) : '—'}</td>
                            <td className="text-right py-2 px-2">{ecart !== null ? ecartBadge(ecart) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const totalCalc = batiments.reduce((s, b) => s + consoCalculee(b), 0);
                        const totalReel = batiments.reduce((s, b) => s + (b.consommationsReelles || 0), 0);
                        const ecartTotal = calculEcartConsoPct(totalReel, totalCalc);
                        return (
                          <tr className="border-t-2 border-gray-300 font-bold">
                            <td className="py-2 px-2">TOTAL</td>
                            <td className="text-right py-2 px-2">{totalCalc > 0 ? fmtKwh(totalCalc) : '—'}</td>
                            <td className="text-right py-2 px-2">{totalReel > 0 ? fmtKwh(totalReel) : '—'}</td>
                            <td className="text-right py-2 px-2">{ecartTotal !== null ? ecartBadge(ecartTotal) : '—'}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Onglet État de référence - champs ref* contrôlés */}
            {activeTab === 'etat_ref' && (
              <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-gray-600 mb-4">Modifier les valeurs de référence pour chaque bâtiment (après travaux d'isolation)</p>
                {batiments.map((batiment) => (
                  <div key={batiment.id} className="mb-4 p-4 bg-white rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">{batiment.designation}</h4>
                      <button
                        type="button"
                        onClick={() => setBatiments(prev => prev.map(b =>
                          b.id === batiment.id ? {
                            ...b,
                            refDeperditions: b.deperditions,
                            refTypeEnergie: b.typeEnergie,
                            refRendementProduction: b.rendementProduction,
                            refRendementDistribution: b.rendementDistribution,
                            refRendementEmission: b.rendementEmission,
                            refRendementRegulation: b.rendementRegulation,
                            refTarification: b.tarification,
                            refAbonnement: b.abonnement,
                          } : b
                        ))}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        ↻ Réinitialiser à l&apos;état initial
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="block text-gray-600 mb-1">Déperditions ref (kW)</label>
                        <input type="number" value={batiment.refDeperditions ?? batiment.deperditions}
                          onChange={(e) => updateBatiment(batiment.id, 'refDeperditions', e.target.value || batiment.deperditions)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Type énergie ref</label>
                        <select value={batiment.refTypeEnergie || batiment.typeEnergie}
                          onChange={(e) => {
                            const newType = e.target.value || null;
                            if (!newType) {
                              // "Identique initial" sélectionné: copier toutes les valeurs EI en un seul update
                              setBatiments(prev => prev.map(b =>
                                b.id === batiment.id ? {
                                  ...b,
                                  refTypeEnergie: b.typeEnergie,
                                  refDeperditions: b.deperditions,
                                  refRendementProduction: b.rendementProduction,
                                  refRendementDistribution: b.rendementDistribution,
                                  refRendementEmission: b.rendementEmission,
                                  refRendementRegulation: b.rendementRegulation,
                                  refTarification: b.tarification,
                                  refAbonnement: b.abonnement,
                                } : b
                              ));
                            } else {
                              updateBatiment(batiment.id, 'refTypeEnergie', newType);
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                          <option value="" disabled>-- Choisir --</option>
                          {TYPES_ENERGIE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt production ref (%)</label>
                        <input type="number" step="1" min="0" max="110" value={batiment.refRendementProduction ?? batiment.rendementProduction}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementProduction', e.target.value || batiment.rendementProduction)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt distribution ref (%)</label>
                        <input type="number" step="1" min="0" max="100" value={batiment.refRendementDistribution ?? batiment.rendementDistribution}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementDistribution', e.target.value || batiment.rendementDistribution)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt émission ref (%)</label>
                        <input type="number" step="1" min="0" max="100" value={batiment.refRendementEmission ?? batiment.rendementEmission}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementEmission', e.target.value || batiment.rendementEmission)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Rdt régulation ref (%)</label>
                        <input type="number" step="1" min="0" max="100" value={batiment.refRendementRegulation ?? batiment.rendementRegulation}
                          onChange={(e) => updateBatiment(batiment.id, 'refRendementRegulation', e.target.value || batiment.rendementRegulation)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Tarification ref (€/kWh)</label>
                        <input type="number" step="0.001" value={batiment.refTarification ?? batiment.tarification}
                          onChange={(e) => updateBatiment(batiment.id, 'refTarification', e.target.value || batiment.tarification)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">Abonnement ref (€/an)</label>
                        <input type="number" value={batiment.refAbonnement ?? batiment.abonnement}
                          onChange={(e) => updateBatiment(batiment.id, 'refAbonnement', e.target.value || batiment.abonnement)}
                          className="w-full px-2 py-1 border border-gray-300 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton sauvegarde */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
              >
                Enregistrer les bâtiments
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
