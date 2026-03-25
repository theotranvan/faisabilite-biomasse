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
  activeParcsNums: number[];
}

export function PDFExportButton({ affaireId, referenceAffaire, nomClient, ville, activeParcsNums }: PDFExportProps) {
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatingParcLabel, setGeneratingParcLabel] = useState<number | null>(null);
  const [generatingParcReport, setGeneratingParcReport] = useState<number | null>(null);
  const [error, setError] = useState('');

  const generateLabel = async (parcFilter?: number) => {
    setError('');
    if (parcFilter != null) setGeneratingParcLabel(parcFilter);
    else setIsGeneratingLabel(true);

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
      pdf.text('Etiquettes Energetiques DPE', pageWidth / 2, y, { align: 'center' });
      y += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(80);
      const subtitle = parcFilter != null
        ? `${referenceAffaire} - ${nomClient} - ${ville} - Parc ${parcFilter}`
        : `${referenceAffaire} - ${nomClient} - ${ville}`;
      pdf.text(subtitle, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // DPE scale definition (official French thresholds)
      const dpeClasses = [
        { label: 'A', min: 0, max: 50, color: [0, 128, 0] },
        { label: 'B', min: 51, max: 90, color: [50, 180, 50] },
        { label: 'C', min: 91, max: 150, color: [180, 200, 0] },
        { label: 'D', min: 151, max: 230, color: [255, 215, 0] },
        { label: 'E', min: 231, max: 330, color: [255, 165, 0] },
        { label: 'F', min: 331, max: 450, color: [255, 100, 0] },
        { label: 'G', min: 451, max: 9999, color: [220, 0, 0] },
      ];

      const allBatiments = calcData?.batiments || [];
      const batiments = parcFilter != null
        ? allBatiments.filter((b: any) => b.parc === parcFilter)
        : allBatiments;
      if (batiments.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(150, 0, 0);
        pdf.text('Aucun batiment disponible pour generer les etiquettes.', pageWidth / 2, y, { align: 'center' });
      }

      for (const bat of batiments) {
        if (y > 200) { pdf.addPage(); y = 20; }

        const consoPerM2 = bat.conso_kwhep_per_m2 || 0;
        const dpeLabel = bat.etiquette_dpe || 'N/A';

        // Building header
        pdf.setFontSize(14);
        pdf.setTextColor(0, 102, 204);
        pdf.text(`Batiment ${bat.numero} : ${bat.designation} (${bat.surface_chauffee} m${String.fromCharCode(178)})`, 20, y);
        y += 10;

        // Draw DPE arrow bars
        const barStartX = 20;
        const barHeight = 10;
        const barSpacing = 2;
        const arrowTipW = 6;

        for (let i = 0; i < dpeClasses.length; i++) {
          const cls = dpeClasses[i];
          const barWidth = 45 + i * 14;
          const isActive = cls.label === dpeLabel;

          const bx = barStartX;
          const by = y;

          // Draw arrow shape: rect + triangle tip
          pdf.setFillColor(cls.color[0], cls.color[1], cls.color[2]);
          pdf.rect(bx, by, barWidth, barHeight, 'F');
          // Arrow tip triangle
          pdf.triangle(
            bx + barWidth, by,
            bx + barWidth + arrowTipW, by + barHeight / 2,
            bx + barWidth, by + barHeight,
            'F'
          );

          // Letter label in white inside bar
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(cls.label, bx + 5, by + 7.5);

          // Threshold range right of arrow
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          const thresholdX = bx + barWidth + arrowTipW + 4;
          if (cls.max < 9999) {
            pdf.text(`${cls.min} a ${cls.max}`, thresholdX, by + 7);
          } else {
            pdf.text(`> ${cls.min}`, thresholdX, by + 7);
          }

          // Active class: bold outline + consumption value
          if (isActive) {
            pdf.setDrawColor(30, 30, 30);
            pdf.setLineWidth(2);
            pdf.rect(bx - 1, by - 1, barWidth + arrowTipW + 2, barHeight + 2);
            // Consumption value
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${Math.round(consoPerM2)} kWh/m${String.fromCharCode(178)}/an`, thresholdX + 30, by + 7.5);
          }

          y += barHeight + barSpacing;
        }

        y += 15;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

      const fileName = parcFilter != null
        ? `etiquettes_dpe_${referenceAffaire}_parc${parcFilter}.pdf`
        : `etiquettes_dpe_${referenceAffaire}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Erreur lors de la generation de l'etiquette: ${errorMsg}`);
    } finally {
      setIsGeneratingLabel(false);
      setGeneratingParcLabel(null);
    }
  };

  const generateFullReport = async (parcFilter?: number) => {
    setError('');
    if (parcFilter != null) setGeneratingParcReport(parcFilter);
    else setIsGeneratingReport(true);

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
        pdf.text(`Rapport Faisabilite Biomasse - ${referenceAffaire} - Page ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
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
      const fmtEur = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' EUR';
      const fmtNum = (v: number, d = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: d });

      // ===== PAGE DE GARDE =====
      pdf.setFillColor(0, 70, 160);
      pdf.rect(0, 0, pageWidth, 80, 'F');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Rapport de Faisabilite', pageWidth / 2, 35, { align: 'center' });
      pdf.setFontSize(20);
      pdf.text('Chaufferie Biomasse', pageWidth / 2, 50, { align: 'center' });
      pdf.setFontSize(12);
      const coverRef = parcFilter != null
        ? `${referenceAffaire} - Parc ${parcFilter}`
        : referenceAffaire;
      pdf.text(coverRef, pageWidth / 2, 68, { align: 'center' });

      y = 100;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(`Client : ${nomClient}`, margin, y); y += 10;
      pdf.text(`Localisation : ${ville}`, margin, y); y += 10;
      if (affaireData?.departement) {
        pdf.text(`Departement : ${affaireData.departement}`, margin, y); y += 10;
      }
      pdf.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, margin, y); y += 20;

      // Paramètres
      if (affaireData) {
        pdf.setFontSize(11);
        pdf.setTextColor(80);
        pdf.text(`DJU retenu : ${affaireData.djuRetenu || 'N/A'}  |  T ext. base : ${affaireData.tempExtBase ?? 'N/A'}C  |  T int. base : ${affaireData.tempIntBase ?? 'N/A'}C`, margin, y);
        y += 8;
        pdf.text(`Duree emprunt : ${affaireData.dureeEmprunt || 15} ans  |  Aug. fossile : ${((affaireData.augmentationFossile || 0.04) * 100).toFixed(1)}%/an  |  Aug. biomasse : ${((affaireData.augmentationBiomasse || 0.02) * 100).toFixed(1)}%/an`, margin, y);
      }

      addFooter(1);

      // ===== SECTION 2: BATIMENTS =====
      pdf.addPage(); y = 20;
      sectionTitle('1', parcFilter != null ? `Batiments analyses - Parc ${parcFilter}` : 'Batiments analyses');

      const allBats = calcData?.batiments || [];
      const bats = parcFilter != null
        ? allBats.filter((b: any) => b.parc === parcFilter)
        : allBats;
      if (bats.length === 0) {
        pdf.text('Aucun batiment disponible.', margin + 5, y); y += 8;
      } else {
        // Table header
        checkPage(12);
        pdf.setFillColor(240, 240, 245);
        pdf.rect(margin, y - 4, contentWidth, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(60);
        const cols = [margin + 2, margin + 15, margin + 50, margin + 80, margin + 105, margin + 130, margin + 155];
        pdf.text('No', cols[0], y);
        pdf.text('Designation', cols[1], y);
        pdf.text(`Surface (m${String.fromCharCode(178)})`, cols[2], y);
        pdf.text('Conso kWhep', cols[3], y);
        pdf.text('Cout EI (EUR/an)', cols[4], y);
        pdf.text('Cout Ref (EUR/an)', cols[5], y);
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
      sectionTitle('2', 'Etiquettes energetiques DPE');
      const dpeClasses = [
        { label: 'A', min: 0, max: 50, color: [0, 128, 0] },
        { label: 'B', min: 51, max: 90, color: [50, 180, 50] },
        { label: 'C', min: 91, max: 150, color: [180, 200, 0] },
        { label: 'D', min: 151, max: 230, color: [255, 215, 0] },
        { label: 'E', min: 231, max: 330, color: [255, 165, 0] },
        { label: 'F', min: 331, max: 450, color: [255, 100, 0] },
        { label: 'G', min: 451, max: 9999, color: [220, 0, 0] },
      ];

      for (const bat of bats) {
        checkPage(100);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${bat.designation} (${fmtNum(bat.surface_chauffee || 0)} m${String.fromCharCode(178)})`, margin + 5, y);
        pdf.setFont('helvetica', 'normal');
        y += 8;
        const barH = 8;
        const arrowTip = 5;
        for (let i = 0; i < dpeClasses.length; i++) {
          const cls = dpeClasses[i];
          const barW = 35 + i * 11;
          const isActive = cls.label === bat.etiquette_dpe;
          const bx = margin + 5;
          // Arrow bar + tip
          pdf.setFillColor(cls.color[0], cls.color[1], cls.color[2]);
          pdf.rect(bx, y, barW, barH, 'F');
          pdf.triangle(bx + barW, y, bx + barW + arrowTip, y + barH / 2, bx + barW, y + barH, 'F');
          // Letter
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(cls.label, bx + 4, y + 6);
          // Threshold
          const thX = bx + barW + arrowTip + 3;
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          if (cls.max < 9999) {
            pdf.text(`${cls.min} a ${cls.max}`, thX, y + 5.5);
          } else {
            pdf.text(`> ${cls.min}`, thX, y + 5.5);
          }
          if (isActive) {
            pdf.setDrawColor(30, 30, 30);
            pdf.setLineWidth(1.5);
            pdf.rect(bx - 1, y - 0.5, barW + arrowTip + 2, barH + 1);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${Math.round(bat.conso_kwhep_per_m2 || 0)} kWh/m${String.fromCharCode(178)}/an`, thX + 25, y + 6);
          }
          y += barH + 1.5;
        }
        y += 10;
      }

      // ===== SECTION 4: ANALYSE FINANCIERE =====
      pdf.addPage(); y = 20;
      sectionTitle('3', 'Analyse financiere');

      const chiffrageArr = calcData?.chiffrage || [];
      const parcAgrArr = calcData?.parcAgregation || [];
      const chiff = parcFilter != null
        ? chiffrageArr.find((c: any) => c.parc === parcFilter)
        : chiffrageArr.length === 1 ? chiffrageArr[0] : null;
      if (chiff) {
        addRow('Investissement reference HT', chiff.investissement_ht != null ? fmtEur(chiff.investissement_ht) : 'N/A');
        addRow('Investissement biomasse HT', fmtEur(chiff.investissement_bio_ht || 0));
        addRow('Subventions biomasse', fmtEur(chiff.subventions_bio || 0));
        addRow('Net a investir (biomasse)', fmtEur((chiff.investissement_bio_ht || 0) - (chiff.subventions_bio || 0)));
        addRow('Annuite reference', chiff.annuite != null ? fmtEur(chiff.annuite) : 'N/A');
        addRow('Annuite biomasse', fmtEur(chiff.annuite_biomasse || 0));
        y += 5; drawLine();
      } else if (parcFilter == null && chiffrageArr.length > 1) {
        // Multiple parcs, no filter: show summary for each
        for (const c of chiffrageArr) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Parc ${c.parc}`, margin + 5, y); y += 7;
          pdf.setFont('helvetica', 'normal');
          addRow('Investissement reference HT', c.investissement_ht != null ? fmtEur(c.investissement_ht) : 'N/A');
          addRow('Investissement biomasse HT', fmtEur(c.investissement_bio_ht || 0));
          addRow('Subventions biomasse', fmtEur(c.subventions_bio || 0));
          addRow('Net a investir (biomasse)', fmtEur((c.investissement_bio_ht || 0) - (c.subventions_bio || 0)));
          addRow('Annuite reference', c.annuite != null ? fmtEur(c.annuite) : 'N/A');
          addRow('Annuite biomasse', fmtEur(c.annuite_biomasse || 0));
          y += 3; drawLine();
        }
      }

      const parc = parcFilter != null
        ? parcAgrArr.find((p: any) => p.parc === parcFilter)
        : parcAgrArr.length === 1 ? parcAgrArr[0] : null;
      if (parc) {
        addRow('Cout exploitation reference', fmtEur(parc.cout_total || 0) + '/an');
        addRow('Cout exploitation biomasse', fmtEur(parc.cout_biomasse || 0) + '/an');
        addRow('Economie annuelle', fmtEur((parc.cout_total || 0) - (parc.cout_biomasse || 0)) + '/an');
        y += 5;
      } else if (parcFilter == null && parcAgrArr.length > 1) {
        for (const p of parcAgrArr) {
          checkPage(30);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Parc ${p.parc}`, margin + 5, y); y += 7;
          pdf.setFont('helvetica', 'normal');
          addRow('Cout exploitation reference', fmtEur(p.cout_total || 0) + '/an');
          addRow('Cout exploitation biomasse', fmtEur(p.cout_biomasse || 0) + '/an');
          addRow('Economie annuelle', fmtEur((p.cout_total || 0) - (p.cout_biomasse || 0)) + '/an');
          y += 3;
        }
      }

      // ===== SECTION 5: BILAN 20 ANS =====
      y += 5;
      sectionTitle('4', 'Bilan actualise sur 20 ans');

      const bilan = parcFilter != null
        ? (calcData?.bilanParParc?.[parcFilter] || [])
        : (calcData?.bilanActualize || []);
      if (bilan.length > 0) {
        // Table header
        checkPage(12);
        pdf.setFillColor(240, 240, 245);
        pdf.rect(margin, y - 4, contentWidth, 8, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(60);
        const bCols = [margin + 2, margin + 20, margin + 55, margin + 90, margin + 125];
        pdf.text('Annee', bCols[0], y);
        pdf.text('Cout initial (EUR)', bCols[1], y);
        pdf.text('Cout reference (EUR)', bCols[2], y);
        pdf.text('Cout biomasse (EUR)', bCols[3], y);
        pdf.text('Economie (EUR)', bCols[4], y);
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
        pdf.text(`Economies cumulees sur 20 ans : ${fmtEur(totalEconomies)}`, margin + 5, y);
        pdf.setTextColor(0, 0, 0);
      }

      // ===== SECTION 6: IMPACT ENVIRONNEMENTAL =====
      checkPage(40);
      y += 10;
      sectionTitle('5', 'Impact environnemental');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Les donnees detaillees CO2 et SO2 sont disponibles dans l\'onglet Resultats de l\'application.', margin + 5, y);
      y += 8;
      pdf.text('La solution biomasse permet une reduction significative des emissions de gaz a effet de serre', margin + 5, y);
      y += 6;
      pdf.text('par rapport aux solutions fossiles (fuel, gaz).', margin + 5, y);

      addFooter(pdf.getNumberOfPages());

      const fileName = parcFilter != null
        ? `rapport_${referenceAffaire}_parc${parcFilter}.pdf`
        : `rapport_${referenceAffaire}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Erreur lors de la generation du rapport: ${errorMsg}`);
    } finally {
      setIsGeneratingReport(false);
      setGeneratingParcReport(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Exports PDF</h3>
      </CardHeader>
      {error && <Alert type="error" className="m-6 mb-0">{error}</Alert>}
      <div className="p-6 space-y-6">
        {/* --- Etiquettes DPE --- */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Étiquettes DPE</h4>
          <Button 
            variant="primary" 
            onClick={() => generateLabel()} 
            loading={isGeneratingLabel} 
            className="w-full"
            title="Télécharger les étiquettes DPE de tous les bâtiments"
          >
            📌 Exporter toutes les étiquettes
          </Button>
          {activeParcsNums.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activeParcsNums.map((num) => (
                <Button
                  key={`label-parc-${num}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => generateLabel(num)}
                  loading={generatingParcLabel === num}
                  title={`Étiquettes DPE du Parc ${num} uniquement`}
                >
                  📌 Parc {num}
                </Button>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Exporte les étiquettes énergétiques DPE des bâtiments.
          </p>
        </div>

        {/* --- Rapport complet --- */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Rapport complet</h4>
          <Button 
            variant="secondary" 
            onClick={() => generateFullReport()} 
            loading={isGeneratingReport} 
            className="w-full"
            title="Télécharger le rapport complet avec tous les résultats"
          >
            📄 Exporter le rapport complet
          </Button>
          {activeParcsNums.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activeParcsNums.map((num) => (
                <Button
                  key={`report-parc-${num}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => generateFullReport(num)}
                  loading={generatingParcReport === num}
                  title={`Rapport du Parc ${num} uniquement`}
                >
                  📄 Parc {num}
                </Button>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Télécharge un rapport détaillé en format PDF. Exportez par parc pour un rapport ciblé.
          </p>
        </div>
      </div>
    </Card>
  );
}
