import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const affaireId = params.id;

  try {
    // Dummy response avec structure correcte pour le frontend
    return NextResponse.json({
      affaire: {
        id: affaireId,
        nomClient: 'Exemple',
        ville: 'Paris',
        departement: '75',
      },
      batiments: [
        {
          numero: 1,
          designation: 'Bâtiment Principal',
          parc: 1,
          rendement_moyen: 0.65,
          conso_kwhep: 50000,
          conso_pcs: 45000,
          cout_annuel: 5850,
          conso_ref_calculees: 45000,
          conso_ref_pcs: 49500,
          conso_sortie_chaudieres_ref: 45000,
          cout_annuel_ref: 6440,
          conso_kwhep_per_m2: 150, // Consommation spécifique en kWh/m²/an
          etiquette_dpe: 'C', // étiquette DPE (A-G)
          co2_initial: 5.85,
          co2_reference: 12.04,
          co2_biomasse: 0.59,
          co2_savings: 11.45,
          so2_initial: 0.034,
          so2_reference: 0.035,
          so2_biomasse: 0.011,
          so2_savings: 0.024,
        },
      ],
      parcAgregation: [
        {
          parc: 1,
          puissance_kW: 25,
          conso_kWh: 45000,
          cout_total: 6440,
        },
      ],
      chiffrage: [
        {
          parc: 1,
          sous_total_chaufferie: 50000,
          frais_annexes: 15000,
          investissement_ht: 65000,
          tva: 12350,
          investissement_ttc: 77350,
          annuite: 5500,
        },
      ],
      bilanActualize: Array.from({ length: 20 }, (_, i) => ({
        annee: i + 1,
        cout_initial: 5850 * Math.pow(1.04, i),
        cout_reference: 6440 * Math.pow(1.04, i),
        cout_biomasse: 6440 * Math.pow(1.02, i),
        economies_bio_vs_ref: (6440 - 5850) * i,
        economies_an_1: 590,
      })),
    });
  } catch (error) {
    console.error('Erreur calculs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul' },
      { status: 500 }
    );
  }
}
