'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import jsPDF from 'jspdf';

interface PDFExportProps {
  affaireId: string;
  referenceAffaire: string;
  nomClient: string;
  ville: string;
}

export function PDFExportButton({ affaireId, referenceAffaire, nomClient, ville }: PDFExportProps) {
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState('');

  const generateLabel = async () => {
    setError('');
    setIsGeneratingLabel(true);

    try {
      // Fetch calculation results to get DPE data
      let calcData: any = null;
      try {
        const res = await fetch(`/api/calculs/${affaireId}`);
        if (res.ok) calcData = await res.json();
      } catch { /* continue without data */ }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Etiquettes Energétiques DPE', pageWidth / 2, y, { align: 'center' });
      y += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(80);
      pdf.text(`${referenceAffaire} - ${nomClient} - ${ville}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // DPE scale definition
      const dpeClasses = [
        { label: 'A', max: 50, color: [0, 128, 0] },
        { label: 'B', max: 90, color: [50, 180, 50] },
        { label: 'C', max: 150, color: [180, 200, 0] },
        { label: 'D', max: 230, color: [255, 215, 0] },
        { label: 'E', max: 330, color: [255, 165, 0] },
        { label: 'F', max: 450, color: [255, 100, 0] },
        { label: 'G', max: 9999, color: [220, 0, 0] },
      ];

      const batiments = calcData?.batiments || [];
      if (batiments.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(150, 0, 0);
        pdf.text('Aucun bâtiment disponible pour générer les étiquettes.', pageWidth / 2, y, { align: 'center' });
      }

      for (const bat of batiments) {
        if (y > 220) { pdf.addPage(); y = 20; }

        const consoPerM2 = bat.conso_kwhep_per_m2 || 0;
        const dpeLabel = bat.etiquette_dpe || 'N/A';

        // Building header
        pdf.setFontSize(13);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Bâtiment ${bat.numero} : ${bat.designation} (${bat.surface_chauffee} m²)`, 20, y);
        y += 8;

        // Draw DPE bar chart
        const barStartX = 25;
        const barHeight = 7;

        for (const cls of dpeClasses) {
          const barWidth = 40 + dpeClasses.indexOf(cls) * 13;
          const isActive = cls.label === dpeLabel;

          // Bar
          pdf.setFillColor(cls.color[0], cls.color[1], cls.color[2]);
          pdf.rect(barStartX, y, barWidth, barHeight, 'F');

          // Label in bar
          pdf.setFontSize(9);
          pdf.setTextColor(255, 255, 255);
          pdf.text(cls.label, barStartX + 3, y + 5.5);

          // Threshold text
          pdf.setFontSize(7);
          pdf.setTextColor(80);
          if (cls.max < 9999) {
            pdf.text(`≤ ${cls.max}`, barStartX + barWidth + 2, y + 5);
          }

          // Active indicator
          if (isActive) {
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(1.5);
            pdf.rect(barStartX - 1, y - 0.5, barWidth + 2, barHeight + 1);
            // Show value
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${Math.round(consoPerM2)} kWh/m²/an`, barStartX + barWidth + 15, y + 5.5);
          }

          y += barHeight + 1.5;
        }

        y += 10;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

      const fileName = `etiquettes_dpe_${referenceAffaire}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Erreur lors de la génération de l'étiquette: ${errorMsg}`);
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const generateFullReport = async () => {
    setError('');
    setIsGeneratingReport(true);

    try {
      // Fetch full affaire data + calculation results
      let affaireData: any = null;
      let calcData: any = null;
      try {
        const [affRes, calcRes] = await Promise.all([
          fetch(`/api/affaires/${affaireId}`),
          fetch(`/api/calculs/${affaireId}`),
        ]);
        if (affRes.ok) affaireData = await affRes.json();
        if (calcRes.ok) calcData = await calcRes.json();
      } catch { /* continue with available data */ }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let y = 20;

      const addFooter = (pageNum: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Rapport Faisabilité Biomasse - ${referenceAffaire} - Page ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      };
      const checkPage = (need: number) => {
        if (y + need > pageHeight - 20) {
          addFooter(pdf.getNumberOfPages());
          pdf.addPage();
          y = 20;
        }
      };
      const drawLine = () => { pdf.setDrawColor(200); pdf.line(margin, y, pageWidth - margin, y); y += 5; };
      const sectionTitle = (num: string, title: string) => {
        checkPage(20);
        pdf.setFontSize(14);
        pdf.setTextColor(0, 70, 160);
        pdf.text(`${num}. ${title}`, margin, y);
        y += 3;
        pdf.setDrawColor(0, 70, 160);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, margin + 60, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      };
      const addRow = (label: string, value: string) => {
        checkPage(8);
        pdf.setFontSize(10);
        pdf.text(label, margin + 5, y);
        pdf.text(value, pageWidth - margin, y, { align: 'right' });
        y += 6;
      };
      const fmtEur = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
      const fmtNum = (v: number, d = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: d });

      // ===== PAGE DE GARDE =====
      pdf.setFillColor(0, 70, 160);
      pdf.rect(0, 0, pageWidth, 80, 'F');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Rapport de Faisabilité', pageWidth / 2, 35, { align: 'center' });
      pdf.setFontSize(20);
      pdf.text('Chaufferie Biomasse', pageWidth / 2, 50, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(referenceAffaire, pageWidth / 2, 68, { align: 'center' });

      y = 100;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(`Client : ${nomClient}`, margin, y); y += 10;
      pdf.text(`Localisation : ${ville}`, margin, y); y += 10;
      if (affaireData?.departement) {
        pdf.text(`Département : ${affaireData.departement}`, margin, y); y += 10;
      }
      pdf.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, margin, y); y += 20;

      // Paramètres
      if (affaireData) {
        pdf.setFontSize(11);
        pdf.setTextColor(80);
        pdf.text(`DJU retenu : ${affaireData.djuRetenu || 'N/A'}  |  T° ext. base : ${affaireData.tempExtBase ?? 'N/A'}°C  |  T° int. base : ${affaireData.tempIntBase ?? 'N/A'}°C`, margin, y);
        y += 8;
        pdf.text(`Durée emprunt : ${affaireData.dureeEmprunt || 15} ans  |  Aug. fossile : ${((affaireData.augmentationFossile || 0.04) * 100).toFixed(1)}%/an  |  Aug. biomasse : ${((affaireData.augmentationBiomasse || 0.02) * 100).toFixed(1)}%/an`, margin, y);
      }

      addFooter(1);

      // ===== SECTION 2: BATIMENTS =====
      pdf.addPage(); y = 20;
      sectionTitle('1', 'Bâtiments analysés');

      const bats = calcData?.batiments || [];
      if (bats.length === 0) {
        pdf.text('Aucun bâtiment disponible.', margin + 5, y); y += 8;
      } else {
        // Table header
        checkPage(12);
        pdf.setFillColor(240, 240, 245);
        pdf.rect(margin, y - 4, contentWidth, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(60);
        const cols = [margin + 2, margin + 15, margin + 50, margin + 80, margin + 105, margin + 130, margin + 155];
        pdf.text('N°', cols[0], y);
        pdf.text('Désignation', cols[1], y);
        pdf.text('Surface (m²)', cols[2], y);
        pdf.text('Conso kWhep', cols[3], y);
        pdf.text('Coût EI (€/an)', cols[4], y);
        pdf.text('Coût Réf (€/an)', cols[5], y);
        pdf.text('DPE', cols[6], y);
        y += 6;
        pdf.setTextColor(0, 0, 0);

        for (const bat of bats) {
          checkPage(8);
          pdf.setFontSize(9);
          pdf.text(`${bat.numero}`, cols[0], y);
          pdf.text(bat.designation || '', cols[1], y);
          pdf.text(fmtNum(bat.surface_chauffee || 0), cols[2], y);
          pdf.text(fmtNum(bat.conso_kwhep || 0), cols[3], y);
          pdf.text(fmtEur(bat.cout_annuel || 0), cols[4], y);
          pdf.text(fmtEur(bat.cout_annuel_ref || 0), cols[5], y);
          pdf.text(bat.etiquette_dpe || 'N/A', cols[6], y);
          y += 6;
        }
      }

      // ===== SECTION 3: ETIQUETTES DPE =====
      y += 5;
      sectionTitle('2', 'Étiquettes énergétiques DPE');
      const dpeClasses = [
        { label: 'A', max: 50, color: [0, 128, 0] },
        { label: 'B', max: 90, color: [50, 180, 50] },
        { label: 'C', max: 150, color: [180, 200, 0] },
        { label: 'D', max: 230, color: [255, 215, 0] },
        { label: 'E', max: 330, color: [255, 165, 0] },
        { label: 'F', max: 450, color: [255, 100, 0] },
        { label: 'G', max: 9999, color: [220, 0, 0] },
      ];

      for (const bat of bats) {
        checkPage(75);
        pdf.setFontSize(11);
        pdf.text(`${bat.designation} (${fmtNum(bat.surface_chauffee || 0)} m²)`, margin + 5, y);
        y += 7;
        const barH = 6;
        for (const cls of dpeClasses) {
          const barW = 35 + dpeClasses.indexOf(cls) * 11;
          const isActive = cls.label === bat.etiquette_dpe;
          pdf.setFillColor(cls.color[0], cls.color[1], cls.color[2]);
          pdf.rect(margin + 5, y, barW, barH, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text(cls.label, margin + 8, y + 4.5);
          if (cls.max < 9999) { pdf.setTextColor(80); pdf.setFontSize(7); pdf.text(`≤ ${cls.max}`, margin + 5 + barW + 2, y + 4); }
          if (isActive) {
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(1.2);
            pdf.rect(margin + 4, y - 0.5, barW + 2, barH + 1);
            pdf.setFontSize(9);
            pdf.setTextColor(0);
            pdf.text(`${Math.round(bat.conso_kwhep_per_m2 || 0)} kWh/m²/an`, margin + 5 + barW + 15, y + 4.5);
          }
          y += barH + 1;
        }
        y += 8;
      }

      // ===== SECTION 4: ANALYSE FINANCIERE =====
      pdf.addPage(); y = 20;
      sectionTitle('3', 'Analyse financière');

      const chiff = calcData?.chiffrage?.[0];
      if (chiff) {
        addRow('Investissement référence HT', chiff.investissement_ht != null ? fmtEur(chiff.investissement_ht) : 'N/A');
        addRow('Investissement biomasse HT', fmtEur(chiff.investissement_bio_ht || 0));
        addRow('Subventions biomasse', fmtEur(chiff.subventions_bio || 0));
        addRow('Net à investir (biomasse)', fmtEur((chiff.investissement_bio_ht || 0) - (chiff.subventions_bio || 0)));
        addRow('Annuité référence', chiff.annuite != null ? fmtEur(chiff.annuite) : 'N/A');
        addRow('Annuité biomasse', fmtEur(chiff.annuite_biomasse || 0));
        y += 5; drawLine();
      }

      const parc = calcData?.parcAgregation?.[0];
      if (parc) {
        addRow('Coût exploitation référence', fmtEur(parc.cout_total || 0) + '/an');
        addRow('Coût exploitation biomasse', fmtEur(parc.cout_biomasse || 0) + '/an');
        addRow('Économie annuelle', fmtEur((parc.cout_total || 0) - (parc.cout_biomasse || 0)) + '/an');
        y += 5;
      }

      // ===== SECTION 5: BILAN 20 ANS =====
      y += 5;
      sectionTitle('4', 'Bilan actualisé sur 20 ans');

      const bilan = calcData?.bilanActualize || [];
      if (bilan.length > 0) {
        // Table header
        checkPage(12);
        pdf.setFillColor(240, 240, 245);
        pdf.rect(margin, y - 4, contentWidth, 8, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(60);
        const bCols = [margin + 2, margin + 20, margin + 55, margin + 90, margin + 125];
        pdf.text('Année', bCols[0], y);
        pdf.text('Coût initial (€)', bCols[1], y);
        pdf.text('Coût référence (€)', bCols[2], y);
        pdf.text('Coût biomasse (€)', bCols[3], y);
        pdf.text('Économie (€)', bCols[4], y);
        y += 6;

        let totalEconomies = 0;
        pdf.setTextColor(0, 0, 0);
        for (const row of bilan) {
          checkPage(6);
          pdf.setFontSize(8);
          pdf.text(`${row.annee}`, bCols[0], y);
          pdf.text(fmtEur(row.cout_initial || 0), bCols[1], y);
          pdf.text(row.cout_reference != null ? fmtEur(row.cout_reference) : 'N/A', bCols[2], y);
          pdf.text(fmtEur(row.cout_biomasse || 0), bCols[3], y);
          const eco = row.economies_bio_vs_ref || 0;
          totalEconomies += eco;
          pdf.setTextColor(eco >= 0 ? 0 : 200, eco >= 0 ? 128 : 0, 0);
          pdf.text(fmtEur(eco), bCols[4], y);
          pdf.setTextColor(0, 0, 0);
          y += 5;
        }

        y += 5;
        pdf.setFontSize(11);
        pdf.setTextColor(0, 100, 0);
        pdf.text(`Économies cumulées sur 20 ans : ${fmtEur(totalEconomies)}`, margin + 5, y);
        pdf.setTextColor(0, 0, 0);
      }

      // ===== SECTION 6: IMPACT ENVIRONNEMENTAL =====
      checkPage(40);
      y += 10;
      sectionTitle('5', 'Impact environnemental');
      pdf.setFontSize(10);
      pdf.text('Les données détaillées CO₂ et SO₂ sont disponibles dans l\'onglet Résultats de l\'application.', margin + 5, y);
      y += 8;
      pdf.text('La solution biomasse permet une réduction significative des émissions de gaz à effet de serre', margin + 5, y);
      y += 6;
      pdf.text('par rapport aux solutions fossiles (fuel, gaz naturel).', margin + 5, y);

      addFooter(pdf.getNumberOfPages());

      const fileName = `rapport_${referenceAffaire}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Erreur lors de la génération du rapport: ${errorMsg}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Exports PDF</h3>
      </CardHeader>
      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}
      <div className="p-6 space-y-4">
        <div>
          <Button 
            variant="primary" 
            onClick={generateLabel} 
            loading={isGeneratingLabel} 
            className="w-full"
            title="Télécharger une étiquette simple avec les informations principales"
          >
            📌 Exporter l'étiquette
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Exporte une étiquette simple avec les informations principales de l'étude.
          </p>
        </div>
        <div>
          <Button 
            variant="secondary" 
            onClick={generateFullReport} 
            loading={isGeneratingReport} 
            className="w-full"
            title="Télécharger un rapport détaillé avec tous les résultats"
          >
            📄 Exporter le rapport complet
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Télécharge un rapport détaillé en format PDF avec tous les résultats et analyses.
          </p>
        </div>
      </div>
    </Card>
  );
}
