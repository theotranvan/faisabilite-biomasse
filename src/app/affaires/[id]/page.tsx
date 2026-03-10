'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAffaires } from '@/lib/hooks/useAffaires';
import Header from '@/components/shared/Header';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { Button, Input, Select, TextArea } from '@/components/ui/Form';
import { BatimentTable } from '@/components/affaire/BatimentTable';
import { ParcConfig } from '@/components/affaire/ParcConfig';
import { IsolationBatimentForm } from '@/components/affaire/IsolationBatimentForm';
import { IsolationParcRecap } from '@/components/affaire/IsolationParcRecap';
import { ChiffrageReferenceForm } from '@/components/affaire/ChiffrageReferenceForm';
import { ChiffrageBiomasseForms } from '@/components/affaire/ChiffrageBiomasseForms';
import { ResultatsPage } from '@/components/affaire/ResultatsPage';
import { ValidationModule } from '@/components/affaire/ValidationModule';
import { PDFExportButton } from '@/components/affaire/PDFExportButton';
import { AffaireActions } from '@/components/affaire/AffaireActions';
import { ProjectSharing } from '@/components/affaire/ProjectSharing';
import { VersionHistory } from '@/components/affaire/VersionHistory';
import { calculConsoSortieParcChaudieresRef } from '@/lib/calculs';

export const dynamic = 'force-dynamic';

interface Affaire {
  id: string;
  referenceAffaire: string;
  nomClient: string;
  adresse: string;
  ville: string;
  departement: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'info', label: 'Informations', icon: '📋' },
  { id: 'batiments', label: 'Bâtiments', icon: '🏢' },
  { id: 'isolation', label: 'Isolation', icon: '🧊' },
  { id: 'parc', label: 'Réseau', icon: '🔥' },
  { id: 'chiffrage', label: 'Coûts', icon: '💰' },
  { id: 'resultats', label: 'Résultats', icon: '📊' },
  { id: 'validation', label: 'Validation', icon: '✓' },
  { id: 'export', label: 'Export', icon: '📄' },
  { id: 'sharing', label: 'Partage', icon: '👥' },
  { id: 'history', label: 'Historique', icon: '⏰' },
];

const DEPARTEMENTS = [
  { value: '75', label: '75 - Paris' },
  { value: '92', label: '92 - Hauts-de-Seine' },
  { value: '93', label: '93 - Seine-Saint-Denis' },
  { value: '94', label: '94 - Val-de-Marne' },
  { value: '13', label: '13 - Bouches-du-Rhône' },
  { value: '69', label: '69 - Rhône' },
  { value: '59', label: '59 - Nord' },
  { value: '21', label: '21 - Côte-d\'Or' },
  { value: '38', label: '38 - Isère' },
  { value: '63', label: '63 - Puy-de-Dôme' },
];

export default function AffaireDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { fetchBatiments, saveBatiments, fetchParcs, saveParcs, fetchChiffrageReference, saveChiffrageReference, fetchChiffrageBiomasse, saveChiffrageBiomasse, fetchIsolation, duplicateAffaire } = useAffaires();
  
  const [activeTab, setActiveTab] = useState('info');
  const [affaire, setAffaire] = useState<Affaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Affaire>>({});
  const [selectedBatimentForIsolation, setSelectedBatimentForIsolation] = useState<string | null>(null);
  
  // Tab data
  const [batiments, setBatiments] = useState<any[]>([]);
  const [parcs, setParcs] = useState<any[]>([]);
  const [chiffrageRef, setChiffrageRef] = useState<any>(null);
  const [chiffrageBio, setChiffrageBio] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAffaire = async () => {
      try {
        const response = await fetch(`/api/affaires/${id}`);
        if (!response.ok) {
          setError('Projet non trouvé');
          return;
        }
        const data = await response.json();
        setAffaire(data);
        setEditData(data);
        
        // Load related data
        const [bats, parcsData, refData, bioData] = await Promise.all([
          fetchBatiments(id as string),
          fetchParcs(id as string),
          fetchChiffrageReference(id as string),
          fetchChiffrageBiomasse(id as string),
        ]);
        
        // Load isolation data for each building
        const batsWithIsolation = await Promise.all(
          bats.map(async (bat: any) => {
            const isolationData = await fetchIsolation(id as string, bat.id);
            return {
              ...bat,
              travauxIsolation: isolationData,
            };
          })
        );
        
        setBatiments(batsWithIsolation);
        setParcs(parcsData);
        setChiffrageRef(refData);
        setChiffrageBio(bioData);
      } catch (err) {
        setError('Erreur lors du chargement du projet');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAffaire();
  }, [id, fetchBatiments, fetchParcs, fetchChiffrageReference, fetchChiffrageBiomasse]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['latitude', 'longitude', 'tarifFuelExploitation', 'tarifGazExploitation', 'tarifBoisExploitation', 'tarifElecExploitation'];
    setEditData({
      ...editData,
      [name]: numericFields.includes(name) ? parseFloat(value) || null : value,
    });
  };

  const handleSave = async () => {
    if (!affaire) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/affaires/${affaire.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        setError('Erreur lors de la sauvegarde');
        return;
      }

      const updated = await response.json();
      setAffaire(updated);
      setIsEditing(false);
    } catch (err) {
      setError('Erreur lors de la sauvegarde du projet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (affaireId: string) => {
    try {
      const newAffaire = await duplicateAffaire(affaireId);
      setError('');
      router.push(`/affaires/${newAffaire.id}`);
    } catch (err) {
      setError('Erreur lors de la duplication');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!affaire) return;

    try {
      const response = await fetch(`/api/affaires/${affaire.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...affaire, statut: newStatus }),
      });

      if (!response.ok) {
        setError('Erreur lors du changement de statut');
        return;
      }

      const updated = await response.json();
      setAffaire(updated);
    } catch (err) {
      setError('Erreur lors du changement de statut');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!affaire) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{affaire.referenceAffaire}</h1>
            <p className="text-gray-600 mt-2">{affaire.nomClient} - {affaire.ville}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {isEditing && (
                <>
                  <Button variant="secondary" onClick={() => { setIsEditing(false); setEditData(affaire); }}>
                    Annuler
                  </Button>
                  <Button variant="primary" loading={isSaving} onClick={handleSave}>
                    Enregistrer
                  </Button>
                </>
              )}
              {!isEditing && (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  ✏️ Modifier
                </Button>
              )}
            </div>
            <select
              value={affaire.statut}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BROUILLON">📝 Brouillon</option>
              <option value="EN_COURS">🔄 En cours</option>
              <option value="TERMINE">✅ Terminée</option>
            </select>
          </div>
        </div>

        {error && <Alert type="error" className="mb-6">{error}</Alert>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition flex gap-2 items-center ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'info' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
              </CardHeader>

              {isEditing ? (
                <form className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Nom du client"
                      name="nomClient"
                      value={editData.nomClient || ''}
                      onChange={handleEditChange}
                      required
                    />
                    <Input
                      label="Ville"
                      name="ville"
                      value={editData.ville || ''}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <Input
                    label="Adresse"
                    name="adresse"
                    value={editData.adresse || ''}
                    onChange={handleEditChange}
                    required
                  />

                  <div className="grid grid-cols-3 gap-6">
                    <Select
                      label="Département"
                      name="departement"
                      value={editData.departement || ''}
                      onChange={handleEditChange}
                      options={DEPARTEMENTS}
                      required
                    />
                    <Input
                      label="Latitude"
                      type="number"
                      name="latitude"
                      value={editData.latitude || ''}
                      onChange={handleEditChange}
                      step="0.0001"
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      name="longitude"
                      value={editData.longitude || ''}
                      onChange={handleEditChange}
                      step="0.0001"
                    />
                  </div>

                  <TextArea
                    label="Notes"
                    name="notes"
                    value={editData.notes || ''}
                    onChange={handleEditChange}
                    rows={4}
                  />

                  {/* Ville monotone et tarifs exploitation */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Paramètres monotone & tarifs</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <Select
                        label="Ville monotone"
                        name="villeMonotone"
                        value={(editData as any).villeMonotone || 'Bourges'}
                        onChange={handleEditChange}
                        options={[
                          {value:'Bourges',label:'Bourges'}, {value:'Chartres',label:'Chartres'},
                          {value:'Chateauroux',label:'Châteauroux'}, {value:'Gueret',label:'Guéret'},
                          {value:'Limoges',label:'Limoges'}, {value:'Nevers',label:'Nevers'},
                          {value:'Orleans',label:'Orléans'}, {value:'Paris',label:'Paris'},
                          {value:'Poitiers',label:'Poitiers'}, {value:'Tours',label:'Tours'},
                          {value:'Vichy',label:'Vichy'},
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <Input label="Tarif fuel (€/kWh)" type="number" name="tarifFuelExploitation" step="0.001" value={(editData as any).tarifFuelExploitation || ''} onChange={handleEditChange} />
                      <Input label="Tarif gaz (€/kWh)" type="number" name="tarifGazExploitation" step="0.001" value={(editData as any).tarifGazExploitation || ''} onChange={handleEditChange} />
                      <Input label="Tarif bois (€/kWh)" type="number" name="tarifBoisExploitation" step="0.001" value={(editData as any).tarifBoisExploitation || ''} onChange={handleEditChange} />
                      <Input label="Tarif élec (€/kWh)" type="number" name="tarifElecExploitation" step="0.001" value={(editData as any).tarifElecExploitation || ''} onChange={handleEditChange} />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Client</label>
                      <p className="text-lg text-gray-900 mt-1">{affaire.nomClient}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Référence</label>
                      <p className="text-lg font-mono text-gray-900 mt-1">{affaire.referenceAffaire}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Adresse</label>
                      <p className="text-gray-900 mt-1">{affaire.adresse}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ville</label>
                      <p className="text-gray-900 mt-1">{affaire.ville}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Département</label>
                      <p className="text-gray-900 mt-1">{affaire.departement}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Latitude</label>
                      <p className="text-gray-900 mt-1">{affaire.latitude || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Longitude</label>
                      <p className="text-gray-900 mt-1">{affaire.longitude || 'N/A'}</p>
                    </div>
                  </div>

                  {affaire.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900 mt-1">{affaire.notes}</p>
                    </div>
                  )}

                  {/* Ville monotone et tarifs (lecture) */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Paramètres monotone & tarifs</h3>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ville monotone</label>
                        <p className="text-gray-900 mt-1">{(affaire as any).villeMonotone || 'Bourges'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tarif fuel</label>
                        <p className="text-gray-900 mt-1">{(affaire as any).tarifFuelExploitation ?? 0.10} €/kWh</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tarif gaz</label>
                        <p className="text-gray-900 mt-1">{(affaire as any).tarifGazExploitation ?? 0.1502} €/kWh</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tarif bois</label>
                        <p className="text-gray-900 mt-1">{(affaire as any).tarifBoisExploitation ?? 0.05316} €/kWh</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tarif élec</label>
                        <p className="text-gray-900 mt-1">{(affaire as any).tarifElecExploitation ?? 0.1788} €/kWh</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'batiments' && (
            <BatimentTable
              batiments={batiments}
              onSave={async (bats) => {
                await saveBatiments(affaire.id, bats);
                setBatiments(bats);
              }}
            />
          )}

          {activeTab === 'isolation' && (
            <div className="space-y-6">
              {selectedBatimentForIsolation ? (
                <>
                  <IsolationBatimentForm
                    batimentNumero={batiments.find(b => b.id === selectedBatimentForIsolation)?.numero || 0}
                    batimentDesignation={batiments.find(b => b.id === selectedBatimentForIsolation)?.designation || ''}
                    initialLignes={batiments.find(b => b.id === selectedBatimentForIsolation)?.travauxIsolation?.lignes || []}
                    onSave={async (lignes) => {
                      await fetch(`/api/affaires/${affaire.id}/batiments/${selectedBatimentForIsolation}/isolation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lignes }),
                      });
                      // Refresh data
                      const updated = await fetchBatiments(affaire.id);
                      setBatiments(updated);
                      setSelectedBatimentForIsolation(null);
                    }}
                    onClose={() => setSelectedBatimentForIsolation(null)}
                  />
                </>
              ) : (
                <>
                  <Alert type="info" className="mb-6">
                    💡 Les travaux d'isolation sont saisis <strong>par bâtiment</strong> et apparaissent à titre informatif dans les synthèses. Ils n'entrent <strong>pas</strong> dans le calcul de l'investissement HT.
                  </Alert>
                  {Array.from({ length: 4 }, (_, i) => i + 1)
                    .filter(parcNum => parcs.some(p => p.numero === parcNum))
                    .map((parcNum) => (
                      <IsolationParcRecap
                        key={`parc-${parcNum}`}
                        parcNumero={parcNum}
                        batiments={batiments.filter(b => b.parc === parcNum)}
                        onEditBatiment={(batimentId) => setSelectedBatimentForIsolation(batimentId)}
                      />
                    ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'parc' && (() => {
            const consoBatimentsParParc: Record<number, number> = {};
            [1, 2, 3, 4].forEach(parcNum => {
              const batsParc = batiments.filter((b: any) => b.parc === parcNum && b.etatReference);
              if (batsParc.length > 0) {
                consoBatimentsParParc[parcNum] = calculConsoSortieParcChaudieresRef(
                  batsParc, parcNum,
                  (affaire as any).djuRetenu || 1977,
                  (affaire as any).tempIntBase || 19,
                  (affaire as any).tempExtBase || -7
                );
              }
            });
            return (
              <ParcConfig
                affaireId={affaire.id}
                parcs={parcs}
                consoBatimentsParParc={consoBatimentsParParc}
                onSave={async (p) => {
                  await saveParcs(affaire.id, p);
                  setParcs(p);
                }}
              />
            );
          })()}

          {activeTab === 'chiffrage' && (
            <div className="space-y-6">
              <ChiffrageReferenceForm
                affaireId={affaire.id}
                data={chiffrageRef}
                onSave={async (data) => {
                  await saveChiffrageReference(affaire.id, data);
                  setChiffrageRef(data);
                }}
              />
              <ChiffrageBiomasseForms
                affaireId={affaire.id}
                data={chiffrageBio}
                onSave={async (data) => {
                  await saveChiffrageBiomasse(affaire.id, data);
                  setChiffrageBio(data);
                }}
              />
            </div>
          )}

          {activeTab === 'resultats' && (
            <ResultatsPage
              affaireId={affaire.id}
              batiments={batiments}
              chiffrage={chiffrageRef}
            />
          )}

          {activeTab === 'validation' && (
            <ValidationModule
              data={{ batiments, parcs, chiffrageRef, chiffrageBio }}
            />
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <PDFExportButton
                affaireId={affaire.id}
                referenceAffaire={affaire.referenceAffaire}
                nomClient={affaire.nomClient}
                ville={affaire.ville}
              />
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Actions avancées</h3>
                </CardHeader>
                <div className="p-6">
                  <AffaireActions
                    affaireId={affaire.id}
                    affaireRef={affaire.referenceAffaire}
                    onDuplicate={handleDuplicate}
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'sharing' && (
            <ProjectSharing affaireId={affaire.id} />
          )}

          {activeTab === 'history' && (
            <VersionHistory affaireId={affaire.id} />
          )}
        </div>
      </main>
    </div>
  );
}
