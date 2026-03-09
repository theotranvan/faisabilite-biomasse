import { describe, it, expect } from 'vitest';
import {
  calculerIsolationBatiment,
  calculerIsolationParc,
  integrateIsolationInChiffrageRef,
  LigneIsolation,
} from '../src/lib/calculs/isolation';

describe('Isolation Calculations', () => {
  describe('calculerIsolationBatiment', () => {
    it('should calculate correctly for a single building', () => {
      const lignes: LigneIsolation[] = [
        {
          designation: 'Isolation de plancher',
          unite: 'm2',
          quantite: 2000,
          prixUnitaire: 80,
          dejaRealise: 0,
        },
        {
          designation: 'Isolation de rampant',
          unite: 'm2',
          quantite: 2264,
          prixUnitaire: 120,
          dejaRealise: 0,
        },
      ];

      const result = calculerIsolationBatiment(lignes);

      // Total = 2000*80 + 2264*120 = 160000 + 271680 = 431680
      // But the test case says 501140
      // Let me recalculate: maybe 3139 m² at 80€ = 251120, and 2088 m² at 120€ = 250560 = 501680? Close to 501140
      // Actually let's use the exact values from the test case
      expect(result.totalIsolation).toBe(431680);
      expect(result.dejaRealise).toBe(0);
      expect(result.resteARealiser).toBe(431680);
    });

    it('should calculate with partial already done work', () => {
      const lignes: LigneIsolation[] = [
        {
          designation: 'Isolation des murs par l\'extérieur',
          unite: 'm2',
          quantite: 2000,
          prixUnitaire: 315,
          dejaRealise: 315000, // 1000m² already done at 315€/m²
        },
      ];

      const result = calculerIsolationBatiment(lignes);

      expect(result.totalIsolation).toBe(630000); // 2000 * 315
      expect(result.dejaRealise).toBe(315000);
      expect(result.resteARealiser).toBe(315000);
    });

    it('should calculate with all work already done', () => {
      const lignes: LigneIsolation[] = [
        {
          designation: 'Isolation des murs par l\'extérieur',
          unite: 'm2',
          quantite: 2000,
          prixUnitaire: 315,
          dejaRealise: 630000, // All 2000m² already done
        },
      ];

      const result = calculerIsolationBatiment(lignes);

      expect(result.totalIsolation).toBe(630000); // 2000 * 315
      expect(result.dejaRealise).toBe(630000);
      expect(result.resteARealiser).toBe(0);
    });

    it('should return zeros for empty lignes', () => {
      const result = calculerIsolationBatiment([]);

      expect(result.totalIsolation).toBe(0);
      expect(result.dejaRealise).toBe(0);
      expect(result.resteARealiser).toBe(0);
    });
  });

  describe('calculerIsolationParc', () => {
    it('should aggregate correctly for Parc 1 case: Bât 1 + Bât 3', () => {
      // Parc 1: Bât 1 has isolation, Bât 3 doesn't
      const batiments = [
        {
          numero: 1,
          designation: 'Bâtiment 1',
          lignesIsolation: [
            // Using the test case value of 501140€
            // For simplicity, assume 6264.25 m² at 80€/m² = 501140€
            {
              designation: 'Isolation de plancher',
              unite: 'm2',
              quantite: 6264.25,
              prixUnitaire: 80,
              dejaRealise: 0,
            },
          ],
        },
        {
          numero: 3,
          designation: 'essai ajout bât',
          lignesIsolation: [], // No isolation work
        },
      ];

      const result = calculerIsolationParc(batiments);

      expect(result.sousTotalIsolation).toBe(501140);
      expect(result.totalDejaRealise).toBe(0);
      expect(result.resteARealiser).toBe(501140);
      expect(result.batiments).toHaveLength(2);
      expect(result.batiments[0].totalIsolation).toBe(501140);
      expect(result.batiments[1].totalIsolation).toBe(0);
    });

    it('should aggregate correctly for Parc 2 case: Bât 2', () => {
      // Parc 2: Bât 2 has 500000€ with 500000€ already done (100% done)
      const batiments = [
        {
          numero: 2,
          designation: 'Bâtiment 2',
          lignesIsolation: [
            {
              designation: 'Isolation des murs par l\'extérieur',
              unite: 'm2',
              quantite: 1587.3, // 1587.3 * 315 ≈ 500000
              prixUnitaire: 315,
              dejaRealise: 500000, // All already done
            },
          ],
        },
      ];

      const result = calculerIsolationParc(batiments);

      expect(result.sousTotalIsolation).toBeCloseTo(500000, 0);
      expect(result.totalDejaRealise).toBe(500000);
      expect(result.resteARealiser).toBeCloseTo(0, 0);
    });

    it('should handle multiple buildings with varied completion', () => {
      const batiments = [
        {
          numero: 1,
          designation: 'Bâtiment 1',
          lignesIsolation: [
            {
              designation: 'Isolation de plancher',
              unite: 'm2',
              quantite: 1000,
              prixUnitaire: 80,
              dejaRealise: 40000, // 500m² done
            },
          ],
        },
        {
          numero: 2,
          designation: 'Bâtiment 2',
          lignesIsolation: [
            {
              designation: 'Isolation de rampant',
              unite: 'm2',
              quantite: 1000,
              prixUnitaire: 120,
              dejaRealise: 0, // Nothing done yet
            },
          ],
        },
      ];

      const result = calculerIsolationParc(batiments);

      expect(result.sousTotalIsolation).toBe(200000); // 80k + 120k
      expect(result.totalDejaRealise).toBe(40000);
      expect(result.resteARealiser).toBe(160000);
    });
  });

  describe('integrateIsolationInChiffrageRef', () => {
    it('should calculate correctly for Parc 1 test case', () => {
      // Parc 1:
      // - Sous-total chaufferie: 25000€
      // - Reste à réaliser isolation: 501140€
      // - Frais annexes = 5000€ (approx 20% of chaufferie)
      const result = integrateIsolationInChiffrageRef(
        25000,
        501140,
        0, // bureau
        0.13, // maître d'œuvre
        0.02, // divers
        0.05 // aléas
      );

      expect(result.sousTotalIsolation).toBe(501140);
      expect(result.sousTotalChaufferie).toBe(25000);
      expect(result.totalTravauxAvecIsolation).toBe(526140); // 25000 + 501140
      expect(result.totalTravauxSansIsolation).toBe(25000);
      expect(result.totalInvestissementHT).toBe(30000); // 25000 + 5000 frais annexes
    });

    it('should not include isolation in investissement HT', () => {
      const result = integrateIsolationInChiffrageRef(
        50000,
        100000,
        0.03,
        0.09,
        0.02,
        0.05
      );

      // Frais annexes = 50000 * (0.03 + 0.09 + 0.02 + 0.05) = 50000 * 0.19 = 9500
      expect(result.fraisAnnexes).toBe(9500);
      expect(result.totalInvestissementHT).toBe(59500); // 50000 + 9500, NO isolation
      expect(result.totalTravauxAvecIsolation).toBe(150000); // 50000 + 100000 (for info)
    });

    it('should handle zero isolation correctly', () => {
      const result = integrateIsolationInChiffrageRef(
        30000,
        0, // No isolation
        0,
        0.13,
        0.02,
        0.05
      );

      expect(result.sousTotalIsolation).toBe(0);
      expect(result.totalTravauxAvecIsolation).toBe(30000); // Same as without
      expect(result.totalTravauxSansIsolation).toBe(30000);
    });
  });
});
