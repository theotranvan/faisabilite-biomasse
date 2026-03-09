'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import { Button, Input, Select, TextArea } from '@/components/ui/Form';

interface FormAffaire {
  nomClient: string;
  adresse: string;
  ville: string;
  departement: string;
  notes: string;
  tempExtBase: number;
  tempIntBase: number;
  djuRetenu: number;
  augmentationFossile: number;
  augmentationBiomasse: number;
  dureeEmprunt: number;
}

interface Batiment {
  numero: number;
  designation: string;
  parc: number;
  typeInstallation: string;
  deperditions_kW: number;
  rendementProduction: number;
  rendementDistribution: number;
  rendementEmission: number;
  rendementRegulation: number;
  consommationsCalculees: number;
  consommationsReelles: number;
  typeEnergie: string;
  tarification: number;
  abonnement: number;
}

interface Chiffrage {
  parc: number;
  sousTotalChaufferie: number;
  emprunt: number;
  dureeEmprunt: number;
}

const DEPARTEMENTS = [
  { value: '01', label: '01 - Ain' },
  { value: '13', label: '13 - Bouches-du-Rhône' },
  { value: '18', label: '18 - Cher' },
  { value: '21', label: '21 - Côte-d\'Or' },
  { value: '38', label: '38 - Isère' },
  { value: '42', label: '42 - Loire' },
  { value: '59', label: '59 - Nord' },
  { value: '63', label: '63 - Puy-de-Dôme' },
  { value: '69', label: '69 - Rhône' },
  { value: '75', label: '75 - Paris' },
  { value: '92', label: '92 - Hauts-de-Seine' },
];

const ENERGIES = [
  { value: 'Fuel', label: 'Fuel' },
  { value: 'Gaz naturel', label: 'Gaz naturel' },
  { value: 'Gaz propane', label: 'Gaz propane' },
  { value: 'Electricité', label: 'Électricité' },
  { value: 'Bois plaquette', label: 'Bois plaquette' },
];

const TYPES_INSTALLATION = [
  {
    value: 'ancien_ancien',
    label: '🔴 Très ancienne chaudière (années 60-70)',
    description: 'Surdimensionnée ou peu performante, longue boucle de distribution',
    rendementProduction: 77.5,
    rendementDistribution: 82.5,
    rendementEmission: 92.5,
    rendementRegulation: 87.5,
  },
  {
    value: 'ancien_bon',
    label: '🟠 Ancienne chaudière (bien dimensionnée)',
    description: 'Courte boucle de distribution',
    rendementProduction: 82.5,
    rendementDistribution: 92.5,
    rendementEmission: 95,
    rendementRegulation: 90,
  },
  {
    value: 'moderne',
    label: '🟡 Chaudière haut rendement (années 90-2000)',
    description: 'Courte boucle, radiateurs isolés, sonde extérieure, vannes thermostatiques',
    rendementProduction: 91.5,
    rendementDistribution: 95,
    rendementEmission: 96.5,
    rendementRegulation: 95,
  },
  {
    value: 'condensation',
    label: '🟢 Chaudière gaz à condensation (moderne)',
    description: 'Bien dimensionnée et qui condense',
    rendementProduction: 102,
    rendementDistribution: 95,
    rendementEmission: 96.5,
    rendementRegulation: 95,
  },
];

// Fonction pour calculer l'étiquette DPE selon les seuils officiels
function calculateDPELabel(consoKwhepPerM2: number): { label: string; color: string; min: number; max: number } {
  if (consoKwhepPerM2 < 50) return { label: 'A', color: '#10b981', min: 0, max: 50 };
  if (consoKwhepPerM2 <= 101) return { label: 'B', color: '#84cc16', min: 51, max: 101 };
  if (consoKwhepPerM2 <= 184) return { label: 'C', color: '#eab308', min: 102, max: 184 };
  if (consoKwhepPerM2 <= 299) return { label: 'D', color: '#f97316', min: 185, max: 299 };
  if (consoKwhepPerM2 <= 451) return { label: 'E', color: '#ea580c', min: 300, max: 451 };
  if (consoKwhepPerM2 <= 622) return { label: 'F', color: '#d97706', min: 452, max: 622 };
  return { label: 'G', color: '#b91c1c', min: 623, max: 1000 };
}

export default function NewAffairePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success] = useState('');
  const [step, setStep] = useState(1);
  const [affaireId, setAffaireId] = useState<string | null>(null);

  const [affaire, setAffaire] = useState<FormAffaire>({
    nomClient: '',
    adresse: '',
    ville: '',
    departement: '18',
    notes: '',
    tempExtBase: -7,
    tempIntBase: 19,
    djuRetenu: 1977,
    augmentationFossile: 0.04,
    augmentationBiomasse: 0.02,
    dureeEmprunt: 15,
  });

  const [batiments, setBatiments] = useState<Batiment[]>([
    {
      numero: 1,
      designation: '',
      parc: 1,
      typeInstallation: 'ancien_bon',
      deperditions_kW: 20,
      rendementProduction: 82.5,
      rendementDistribution: 92.5,
      rendementEmission: 95,
      rendementRegulation: 90,
      consommationsCalculees: 70000,
      consommationsReelles: 71000,
      typeEnergie: 'Fuel',
      tarification: 0.13,
      abonnement: 0,
    },
  ]);

  const [chiffrage, setChiffrage] = useState<Chiffrage>({
    parc: 1,
    sousTotalChaufferie: 25000,
    emprunt: 9118.96,
    dureeEmprunt: 15,
  });

  const handleAffaireChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setAffaire({
      ...affaire,
      [name]:
        name.includes('Base') || name.includes('DJU') || name.includes('ugmentation') || name.includes('uree')
          ? parseFloat(value) || 0
          : value,
    });
  };

  const handleBatimentChange = (idx: number, field: string, value: any) => {
    const newBatiments = [...batiments];
    
    // Si on change le type d'installation, charger les présets
    if (field === 'typeInstallation') {
      const preset = TYPES_INSTALLATION.find(t => t.value === value);
      if (preset) {
        newBatiments[idx] = {
          ...newBatiments[idx],
          typeInstallation: value,
          rendementProduction: preset.rendementProduction,
          rendementDistribution: preset.rendementDistribution,
          rendementEmission: preset.rendementEmission,
          rendementRegulation: preset.rendementRegulation,
        };
      }
    } else {
      newBatiments[idx] = {
        ...newBatiments[idx],
        [field]: ['deperditions_kW', 'rendement', 'consommations', 'tarification', 'abonnement'].some(
          (f) => field.includes(f)
        )
          ? parseFloat(value) || 0
          : value,
      };
    }
    setBatiments(newBatiments);
  };

  const addBatiment = () => {
    setBatiments([
      ...batiments,
      {
        numero: batiments.length + 1,
        designation: '',
        parc: 1,
        typeInstallation: 'ancien_bon',
        deperditions_kW: 20,
        rendementProduction: 82.5,
        rendementDistribution: 92.5,
        rendementEmission: 95,
        rendementRegulation: 90,
        consommationsCalculees: 70000,
        consommationsReelles: 71000,
        typeEnergie: 'Fuel',
        tarification: 0.13,
        abonnement: 0,
      },
    ]);
  };

  const removeBatiment = (idx: number) => {
    if (batiments.length > 1) {
      setBatiments(batiments.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!affaire.nomClient || !affaire.ville || !affaire.departement) {
        setError('Veuillez remplir les champs obligatoires');
        return;
      }

      // Créer l'affaire en brouillon si elle n'existe pas
      if (!affaireId) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/affaires', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nomClient: affaire.nomClient,
              adresse: affaire.adresse,
              ville: affaire.ville,
              departement: affaire.departement,
              tempExtBase: affaire.tempExtBase,
              tempIntBase: affaire.tempIntBase,
              djuRetenu: affaire.djuRetenu,
              augmentationFossile: affaire.augmentationFossile,
              augmentationBiomasse: affaire.augmentationBiomasse,
              dureeEmprunt: affaire.dureeEmprunt,
              notes: affaire.notes,
              statut: 'BROUILLON',
            }),
          });

          if (!response.ok) {
            setError('Erreur lors de la création');
            return;
          }

          const newAffaire = await response.json();
          setAffaireId(newAffaire.id);
          setStep(2);
        } catch (err) {
          setError('Erreur lors de la création de l\'affaire');
        } finally {
          setIsLoading(false);
        }
      } else {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      if (batiments.some((b) => !b.designation)) {
        setError('Tous les bâtiments doivent avoir une désignation');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    // Étape 4 : Finaliser et sauvegarder les bâtiments et chiffrage
    setIsLoading(true);
    try {
      // Sauvegarder les bâtiments
      const batimentsRes = await fetch(`/api/affaires/${affaireId}/batiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batiments),
      });

      if (!batimentsRes.ok) {
        setError('Erreur lors de la sauvegarde des bâtiments');
        setIsLoading(false);
        return;
      }

      // Sauvegarder le chiffrage
      const chiffrageRes = await fetch(`/api/affaires/${affaireId}/chiffrage-reference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chiffrage),
      });

      if (!chiffrageRes.ok) {
        setError('Erreur lors de la sauvegarde du chiffrage');
        setIsLoading(false);
        return;
      }

      router.push(`/affaires/${affaireId}`);
    } catch (err) {
      setError('Erreur lors de la finalisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndExit = async () => {
    // Sauvegarder l'affaire actuelle et retourner à la liste
    if (!affaireId) {
      // Créer l'affaire si elle n'existe pas
      setIsLoading(true);
      try {
        const response = await fetch('/api/affaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomClient: affaire.nomClient,
            adresse: affaire.adresse,
            ville: affaire.ville,
            departement: affaire.departement,
            tempExtBase: affaire.tempExtBase,
            tempIntBase: affaire.tempIntBase,
            djuRetenu: affaire.djuRetenu,
            augmentationFossile: affaire.augmentationFossile,
            augmentationBiomasse: affaire.augmentationBiomasse,
            dureeEmprunt: affaire.dureeEmprunt,
            notes: affaire.notes,
            statut: 'BROUILLON',
          }),
        });

        if (response.ok) {
          const newAffaire = await response.json();
          // Sauvegarder les bâtiments si on en a
          if (batiments.length > 0 && !batiments.some(b => !b.designation)) {
            await fetch(`/api/affaires/${newAffaire.id}/batiments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(batiments),
            });
          }
          router.push('/affaires');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sauvegarder les bâtiments avant de quitter
      if (batiments.length > 0) {
        try {
          await fetch(`/api/affaires/${affaireId}/batiments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batiments),
          });
        } catch (err) {
          console.error('Erreur lors de la sauvegarde des bâtiments:', err);
        }
      }
      router.push('/affaires');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Titre */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Nouvelle étude de faisabilité
          </h1>
          <p className="text-lg text-gray-600">
            Biomasse - Chauffage - Réduction d'émissions CO₂
          </p>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-4 mb-8 px-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= s ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {s === 1 ? 'Affaire' : s === 2 ? 'Bâtiments' : s === 3 ? 'Étiquette DPE' : 'Chiffrage'}
              </span>
            </div>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" className="mb-6">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ÉTAPE 1 : AFFAIRE */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  📋 Paramètres généraux
                </h2>
              </CardHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Nom du client *"
                    name="nomClient"
                    value={affaire.nomClient}
                    onChange={handleAffaireChange}
                    placeholder="Mairie de Bourges"
                    required
                  />
                  <Input
                    label="Ville *"
                    name="ville"
                    value={affaire.ville}
                    onChange={handleAffaireChange}
                    placeholder="Bourges"
                    required
                  />
                </div>

                <Input
                  label="Adresse"
                  name="adresse"
                  value={affaire.adresse}
                  onChange={handleAffaireChange}
                  placeholder="123 Rue de Rivoli"
                />

                <Select
                  label="Département *"
                  name="departement"
                  value={affaire.departement}
                  onChange={handleAffaireChange}
                  options={DEPARTEMENTS}
                  required
                />

                <TextArea
                  label="Notes"
                  name="notes"
                  value={affaire.notes}
                  onChange={handleAffaireChange}
                  placeholder="Observations supplémentaires..."
                  rows={3}
                />

                {/* Paramètres climatiques */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    🌡️ Paramètres climatiques
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      label="Temp. int. base (°C)"
                      name="tempIntBase"
                      type="number"
                      value={affaire.tempIntBase}
                      onChange={handleAffaireChange}
                      step={0.1}
                    />
                    <Input
                      label="Temp. ext. base (°C)"
                      name="tempExtBase"
                      type="number"
                      value={affaire.tempExtBase}
                      onChange={handleAffaireChange}
                      step={0.1}
                    />
                    <Input
                      label="DJU retenu"
                      name="djuRetenu"
                      type="number"
                      value={affaire.djuRetenu}
                      onChange={handleAffaireChange}
                      step={1}
                    />
                    <Input
                      label="Durée emprunt (ans)"
                      name="dureeEmprunt"
                      type="number"
                      value={affaire.dureeEmprunt}
                      onChange={handleAffaireChange}
                      step={1}
                    />
                  </div>
                </div>

                {/* Augmentations */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    📈 Facteurs d'augmentation annuelle
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Énergie fossile (%)"
                      name="augmentationFossile"
                      type="number"
                      value={affaire.augmentationFossile * 100}
                      onChange={(e) =>
                        setAffaire({
                          ...affaire,
                          augmentationFossile: parseFloat(e.target.value) / 100,
                        })
                      }
                      step={0.1}
                    />
                    <Input
                      label="Biomasse (%)"
                      name="augmentationBiomasse"
                      type="number"
                      value={affaire.augmentationBiomasse * 100}
                      onChange={(e) =>
                        setAffaire({
                          ...affaire,
                          augmentationBiomasse: parseFloat(e.target.value) / 100,
                        })
                      }
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ÉTAPE 2 : BÂTIMENTS */}
          {step === 2 && (
            <div className="space-y-6">
              {batiments.map((bat, idx) => (
                <Card key={idx}>
                  <CardHeader className="flex justify-between items-center bg-blue-50 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      🏢 Bâtiment {idx + 1}
                    </h2>
                    {batiments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatiment(idx)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    )}
                  </CardHeader>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <Input
                        label="Désignation *"
                        value={bat.designation}
                        onChange={(e) =>
                          handleBatimentChange(idx, 'designation', e.target.value)
                        }
                        placeholder="Bâtiment principal"
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Numéro"
                          type="number"
                          value={bat.numero}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'numero', parseInt(e.target.value))
                          }
                          step={1}
                        />
                        <Input
                          label="Parc"
                          type="number"
                          value={bat.parc}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'parc', parseInt(e.target.value))
                          }
                          step={1}
                        />
                      </div>
                    </div>

                    {/* Déperditions et rendements */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        🔥 Installation chauffage & Rendements
                      </h3>

                      {/* Sélecteur de type d'installation */}
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Select
                          label="Type d'installation chauffage"
                          value={bat.typeInstallation}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'typeInstallation', e.target.value)
                          }
                          options={TYPES_INSTALLATION.map((t) => ({
                            value: t.value,
                            label: t.label,
                          }))}
                        />
                        {bat.typeInstallation && (
                          <p className="text-xs text-gray-600 mt-2">
                            {TYPES_INSTALLATION.find((t) => t.value === bat.typeInstallation)
                              ?.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-3 italic border-t pt-2 mt-2">
                          💡 Conseil : Sélectionnez votre type de chaudière pour pré-remplir automatiquement les rendements.
                          Vous pouvez ensuite les ajuster individuellement.
                        </p>
                      </div>

                      {/* Champs de rendement individuels */}
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Déperditions (kW)"
                          type="number"
                          value={bat.deperditions_kW}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'deperditions_kW', e.target.value)
                          }
                          step={0.1}
                        />
                        <Input
                          label="Rend. production (%)"
                          type="number"
                          value={bat.rendementProduction}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'rendementProduction', e.target.value)
                          }
                          step={1}
                        />
                        <Input
                          label="Rend. distribution (%)"
                          type="number"
                          value={bat.rendementDistribution}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'rendementDistribution', e.target.value)
                          }
                          step={1}
                        />
                        <Input
                          label="Rend. émission (%)"
                          type="number"
                          value={bat.rendementEmission}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'rendementEmission', e.target.value)
                          }
                          step={1}
                        />
                        <Input
                          label="Rend. régulation (%)"
                          type="number"
                          value={bat.rendementRegulation}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'rendementRegulation', e.target.value)
                          }
                          step={1}
                        />
                      </div>
                    </div>

                    {/* Consommation et énergie */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Consommation énergétique
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Type d'énergie"
                          value={bat.typeEnergie}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'typeEnergie', e.target.value)
                          }
                          options={ENERGIES}
                        />
                        <Input
                          label="Tarif (€/kWh)"
                          type="number"
                          value={bat.tarification}
                          onChange={(e) =>
                            handleBatimentChange(idx, 'tarification', e.target.value)
                          }
                          step={0.01}
                        />
                        <Input
                          label="Conso calculée (kWh)"
                          type="number"
                          value={bat.consommationsCalculees}
                          onChange={(e) =>
                            handleBatimentChange(
                              idx,
                              'consommationsCalculees',
                              e.target.value
                            )
                          }
                          step={1}
                        />
                        <Input
                          label="Conso réelles (kWh)"
                          type="number"
                          value={bat.consommationsReelles}
                          onChange={(e) =>
                            handleBatimentChange(
                              idx,
                              'consommationsReelles',
                              e.target.value
                            )
                          }
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                onClick={addBatiment}
                className="w-full bg-green-600 text-white py-3 hover:bg-green-700"
              >
                + Ajouter un bâtiment
              </Button>
            </div>
          )}

          {/* ÉTAPE 3 : ÉTIQUETTE DPE */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  <h2 className="text-lg font-semibold">
                    📊 Étiquette Diagnostic Énergétique (DPE)
                  </h2>
                  <p className="text-sm mt-1 opacity-90">
                    Basée sur la consommation énergétique spécifique (kWh/m²/an)
                  </p>
                </CardHeader>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-8">
                    {batiments.map((bat, idx) => {
                      // Calculer l'étiquette DPE
                      const consoKwhep =
                        bat.typeEnergie === 'Electricité'
                          ? bat.consommationsReelles * 2.3
                          : bat.consommationsReelles;
                      const surfaceChauffee = 100; // Default surface
                      const consoPerM2 = surfaceChauffee > 0 ? consoKwhep / surfaceChauffee : 0;
                      const dpe = calculateDPELabel(consoPerM2);

                      return (
                        <div key={idx} className="border-l-4 border-gray-300 pl-6 hover:border-blue-500 transition">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Bâtiment {bat.numero} - {bat.designation}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Consommation: <strong>{consoPerM2.toFixed(1)} kWh/m²/an</strong>
                              </p>
                            </div>

                            {/* Grande étiquette DPE */}
                            <div className="text-center">
                              <div
                                className="w-24 h-24 rounded-lg flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: dpe.color }}
                              >
                                <span className="text-5xl font-bold text-white">{dpe.label}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-2 font-medium">
                                {dpe.min} - {dpe.max} kWh/m²
                              </p>
                            </div>
                          </div>

                          {/* Échelle visuelle */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex gap-0 h-16 rounded overflow-hidden border border-gray-300">
                              <div className="flex-1 bg-green-600 flex items-center justify-center text-xs font-bold text-white">
                                A
                              </div>
                              <div className="flex-1 bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                                B
                              </div>
                              <div className="flex-1 bg-yellow-400 flex items-center justify-center text-xs font-bold text-white">
                                C
                              </div>
                              <div className="flex-1 bg-yellow-500 flex items-center justify-center text-xs font-bold text-white">
                                D
                              </div>
                              <div className="flex-1 bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
                                E
                              </div>
                              <div className="flex-1 bg-orange-600 flex items-center justify-center text-xs font-bold text-white">
                                F
                              </div>
                              <div className="flex-1 bg-red-600 flex items-center justify-center text-xs font-bold text-white">
                                G
                              </div>
                            </div>
                            <p className="text-xs text-center text-gray-600 mt-3">
                              Échelle DPE - La consommation actuelle du bâtiment
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t mt-8 pt-6 bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>💡 Conseil :</strong> Une étiquette D ou E indique une consommation modérée. Une étiquette F ou G suggère
                      un besoin d'amélioration. La biomasse peut significativement réduire votre consommation et améliorer votre étiquette.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ÉTAPE 4 : CHIFFRAGE */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  💰 Chiffrage de référence
                </h2>
              </CardHeader>

              <div className="p-6 space-y-6">
                <Input
                  label="Parc"
                  type="number"
                  value={chiffrage.parc}
                  onChange={(e) =>
                    setChiffrage({ ...chiffrage, parc: parseInt(e.target.value) })
                  }
                  step={1}
                />

                <Input
                  label="Sous-total chaufferie (€)"
                  type="number"
                  value={chiffrage.sousTotalChaufferie}
                  onChange={(e) =>
                    setChiffrage({
                      ...chiffrage,
                      sousTotalChaufferie: parseFloat(e.target.value),
                    })
                  }
                  step={100}
                />

                <Input
                  label="Montant d'emprunt (€)"
                  type="number"
                  value={chiffrage.emprunt}
                  onChange={(e) =>
                    setChiffrage({ ...chiffrage, emprunt: parseFloat(e.target.value) })
                  }
                  step={100}
                />

                {/* Résumé */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    📊 Récapitulatif
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-xs text-gray-600 mb-1">Total HT</p>
                      <p className="text-xl font-bold text-gray-900">
                        {(chiffrage.sousTotalChaufferie * 1.2).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-xs text-gray-600 mb-1">TVA 20%</p>
                      <p className="text-xl font-bold text-blue-600">
                        {(chiffrage.sousTotalChaufferie * 0.2).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-xs text-gray-600 mb-1">Total TTC</p>
                      <p className="text-xl font-bold text-green-600">
                        {(chiffrage.sousTotalChaufferie * 1.2).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {step > 1 && (
              <Button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 bg-gray-600 text-white hover:bg-gray-700"
              >
                ← Précédent
              </Button>
            )}

            <Button
              type="button"
              onClick={handleSaveAndExit}
              disabled={isLoading}
              className="px-6 py-2 bg-gray-400 text-white hover:bg-gray-500"
            >
              💾 Enregistrer et continuer plus tard
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-2 font-semibold flex-1 sm:flex-none ${
                step === 4
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Chargement...' : step === 4 ? '✓ Créer l\'affaire' : 'Suivant →'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
