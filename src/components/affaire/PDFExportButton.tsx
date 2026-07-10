'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Form';
import { Card, CardHeader, Alert } from '@/components/ui/Layout';
import jsPDF from 'jspdf';

// DPE thresholds per building type (from Excel Etiquette sheet)
const DPE_THRESHOLDS_MAP: Record<string, number[]> = {
  LOGEMENTS:            [50,  90, 150, 230, 330,  450],
  BUREAUX:              [50, 110, 210, 350, 540,  750],
  OCCUPATION_CONTINUE: [100, 210, 370, 580, 830, 1130],
  AUTRES:               [30,  90, 170, 270, 380,  510],
};
const DPE_COLORS = [
  [0, 128, 0], [50, 180, 50], [180, 200, 0],
  [255, 215, 0], [255, 165, 0], [255, 100, 0], [220, 0, 0],
];
const DPE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
function getDpeClasses(typeBatiment?: string) {
  const thresholds = DPE_THRESHOLDS_MAP[typeBatiment || 'LOGEMENTS'] || DPE_THRESHOLDS_MAP.LOGEMENTS;
  return DPE_LABELS.map((label, i) => ({
    label,
    min: i === 0 ? 0 : thresholds[i - 1] + 1,
    max: i < thresholds.length ? thresholds[i] : 9999,
    color: DPE_COLORS[i],
  }));
}

interface PDFExportProps {
  affaireId: string;
  referenceAffaire: string;
  nomClient: string;
  ville: string;
  activeParcsNums: number[];
}

// Logo Combiosol chargé une fois et mis en cache (data URL pour jsPDF.addImage)
let _logoCache: string | null = null;
async function loadLogoDataUrl(): Promise<string | null> {
  if (_logoCache) return _logoCache;
  try {
    const res = await fetch('/logo-combiosol.jpg');
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    _logoCache = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
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

      // Bandeau d'accent orange + logo Combiosol en haut à gauche
      pdf.setFillColor(243, 146, 0);
      pdf.rect(0, 0, pageWidth, 3, 'F');
      const logoLabel = await loadLogoDataUrl();
      if (logoLabel) pdf.addImage(logoLabel, 'JPEG', 18, 8, 16, 16);

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(86, 156, 45);
      pdf.text('Etiquettes Energetiques DPE', pageWidth / 2, y, { align: 'center' });
      y += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(80);
      const subtitle = parcFilter != null
        ? `${referenceAffaire} - ${nomClient} - ${ville} - Parc ${parcFilter}`
        : `${referenceAffaire} - ${nomClient} - ${ville}`;
      pdf.text(subtitle, pageWidth / 2, y, { align: 'center' });
      y += 15;

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
        const dpeClasses = getDpeClasses(bat.typeBatiment);

        // Building header
        pdf.setFontSize(14);
        pdf.setTextColor(86, 156, 45);
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
      const margin = 18;
      const contentWidth = pageWidth - 2 * margin;
      let y = 20;
      let currentPage = 1;

      // ─── Charte graphique Combiosol (vert + orange) ───
      // BLUE/BLUE_LIGHT conservent leur nom mais portent désormais le vert Combiosol
      // (couleur principale des bandeaux, titres et accents).
      const BLUE = [86, 156, 45] as const;        // vert Combiosol (#569C2D)
      const BLUE_LIGHT = [236, 245, 226] as const; // vert très clair (fonds)
      const ORANGE = [243, 146, 0] as const;       // orange/or Combiosol (#F39200)
      const GREEN_DARK = [60, 110, 38] as const;   // vert foncé (titres)
      const GREEN_LIGHT = [236, 245, 226] as const;
      const GRAY = [100, 110, 120] as const;
      const GRAY_LIGHT = [245, 247, 250] as const;
      const RED = [200, 40, 40] as const;

      // ─── Reusable helpers ───
      const setColor = (c: readonly [number, number, number]) => pdf.setTextColor(c[0], c[1], c[2]);
      const setFill = (c: readonly [number, number, number]) => pdf.setFillColor(c[0], c[1], c[2]);

      const addHeader = () => {
        // Top colored bar
        setFill(BLUE);
        pdf.rect(0, 0, pageWidth, 6, 'F');
        // Header line
        pdf.setFontSize(7);
        setColor(GRAY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Combiosol - Rapport de faisabilite biomasse`, margin, 12);
        pdf.text(referenceAffaire, pageWidth - margin, 12, { align: 'right' });
        // Separator
        pdf.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
        pdf.setLineWidth(0.3);
        pdf.line(margin, 14.5, pageWidth - margin, 14.5);
      };

      const addFooterToPage = (pageNum: number) => {
        pdf.setPage(pageNum);
        pdf.setDrawColor(200, 205, 210);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
        pdf.setFontSize(7);
        setColor(GRAY);
        pdf.text(`${nomClient} - ${ville}`, margin, pageHeight - 9);
        pdf.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
        pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, pageHeight - 9, { align: 'right' });
      };

      const newPage = () => {
        pdf.addPage();
        currentPage++;
        addHeader();
        y = 22;
      };

      const checkPage = (need: number) => {
        if (y + need > pageHeight - 22) {
          newPage();
        }
      };

      const sectionTitle = (title: string) => {
        checkPage(18);
        y += 4;
        setFill(BLUE);
        pdf.rect(margin, y - 4.5, 3, 10, 'F');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        setColor(BLUE);
        pdf.text(title, margin + 7, y + 3);
        y += 12;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      };

      const subTitle = (text: string) => {
        checkPage(12);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        setColor(BLUE);
        pdf.text(text, margin + 4, y);
        y += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      };

      const addRow = (label: string, value: string, opts?: { bold?: boolean; color?: readonly [number, number, number]; bg?: readonly [number, number, number] }) => {
        checkPage(7);
        if (opts?.bg) {
          setFill(opts.bg);
          pdf.rect(margin, y - 4, contentWidth, 7, 'F');
        }
        pdf.setFontSize(10);
        pdf.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(label, margin + 5, y);
        if (opts?.color) setColor(opts.color);
        pdf.text(value, pageWidth - margin - 5, y, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        y += 7;
      };

      const fmtEur = (v: number) => {
        const formatted = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return formatted + ' EUR';
      };
      const fmtNum = (v: number, d = 0) => {
        const parts = v.toFixed(d).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return d > 0 ? parts[0] + ',' + (parts[1] || '') : parts[0];
      };

      // ═════════════════════════════════════════
      // PAGE DE GARDE
      // ═════════════════════════════════════════
      // Bandeau d'en-tête vert Combiosol
      setFill(BLUE);
      pdf.rect(0, 0, pageWidth, 95, 'F');

      // Logo Combiosol dans un cartouche blanc en haut à droite
      const logoCover = await loadLogoDataUrl();
      if (logoCover) {
        const lw = 28, lh = 28, lx = pageWidth - margin - lw, ly = 14;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(lx - 3, ly - 3, lw + 6, lh + 6, 3, 3, 'F');
        pdf.addImage(logoCover, 'JPEG', lx, ly, lw, lh);
      }

      // Small brand line
      pdf.setFontSize(10);
      pdf.setTextColor(225, 240, 210);
      pdf.setFont('helvetica', 'normal');
      pdf.text('COMBIOSOL', margin, 22);

      // Main title
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Rapport de', margin, 48);
      pdf.text('Faisabilite Biomasse', margin, 62);

      // Subtitle badge
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(232, 244, 220);
      const coverRef = parcFilter != null ? `${referenceAffaire} - Parc ${parcFilter}` : referenceAffaire;
      pdf.text(coverRef, margin, 78);

      // Date badge right side
      pdf.setFontSize(9);
      pdf.setTextColor(225, 240, 210);
      pdf.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin, 88, { align: 'right' });

      // Ligne d'accent orange Combiosol sous le bandeau
      setFill(ORANGE);
      pdf.rect(0, 95, pageWidth, 2.5, 'F');

      // Client info section
      y = 115;
      pdf.setFontSize(10);
      setColor(GRAY);
      pdf.text('CLIENT', margin, y);
      y += 8;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(nomClient, margin, y);
      y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      setColor(GRAY);
      pdf.text(`${ville}${affaireData?.departement ? ` (${affaireData.departement})` : ''}`, margin, y);

      // Parameters box
      y += 20;
      setFill(GRAY_LIGHT);
      pdf.roundedRect(margin, y - 5, contentWidth, 40, 3, 3, 'F');
      y += 2;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      setColor(BLUE);
      pdf.text('PARAMETRES DE L\'ETUDE', margin + 8, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      const params = [
        [`DJU retenu : ${affaireData?.djuRetenu || 'N/A'}`, `T ext. base : ${affaireData?.tempExtBase ?? 'N/A'} C`],
        [`T int. base : ${affaireData?.tempIntBase ?? 'N/A'} C`, `Duree emprunt : ${affaireData?.dureeEmprunt || 15} ans`],
        [`Aug. fossile : ${((affaireData?.augmentationFossile || 0.04) * 100).toFixed(1)}%/an`, `Aug. biomasse : ${((affaireData?.augmentationBiomasse || 0.02) * 100).toFixed(1)}%/an`],
      ];
      for (const row of params) {
        pdf.text(row[0], margin + 8, y);
        pdf.text(row[1], margin + contentWidth / 2, y);
        y += 6;
      }

      addFooterToPage(1);

      // ═════════════════════════════════════════
      // SECTION 1: BATIMENTS
      // ═════════════════════════════════════════
      newPage();
      sectionTitle('Batiments analyses');

      const allBats = calcData?.batiments || [];
      const bats = parcFilter != null ? allBats.filter((b: any) => b.parc === parcFilter) : allBats;

      if (bats.length === 0) {
        pdf.setFontSize(10);
        setColor(GRAY);
        pdf.text('Aucun batiment disponible.', margin + 5, y);
        y += 8;
      } else {
        // Table header
        checkPage(14);
        setFill(BLUE);
        pdf.rect(margin, y - 5, contentWidth, 8, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);

        const cols = [margin + 3, margin + 12, margin + 48, margin + 76, margin + 104, margin + 132, margin + 158];
        pdf.text('No', cols[0], y - 0.5);
        pdf.text('Designation', cols[1], y - 0.5);
        pdf.text('Surface (m2)', cols[2], y - 0.5);
        pdf.text('Conso kWhep', cols[3], y - 0.5);
        pdf.text('Cout EI (EUR/an)', cols[4], y - 0.5);
        pdf.text('Cout Ref (EUR/an)', cols[5], y - 0.5);
        pdf.text('DPE', cols[6], y - 0.5);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        for (let i = 0; i < bats.length; i++) {
          const bat = bats[i];
          checkPage(7);
          if (i % 2 === 0) {
            setFill(GRAY_LIGHT);
            pdf.rect(margin, y - 4, contentWidth, 6.5, 'F');
          }
          pdf.setFontSize(8);
          pdf.text(`${bat.numero}`, cols[0], y);
          const desig = (bat.designation || '').substring(0, 22);
          pdf.text(desig, cols[1], y);
          pdf.text(fmtNum(bat.surface_chauffee || 0), cols[2], y);
          pdf.text(fmtNum(bat.conso_kwhep || 0), cols[3], y);
          pdf.text(fmtEur(bat.cout_annuel || 0), cols[4], y);
          pdf.text(fmtEur(bat.cout_annuel_ref || 0), cols[5], y);
          // DPE badge
          const dpeLabel = bat.etiquette_dpe || 'N/A';
          const dpeCls = getDpeClasses(bat.typeBatiment).find(c => c.label === dpeLabel);
          if (dpeCls) {
            pdf.setFillColor(dpeCls.color[0], dpeCls.color[1], dpeCls.color[2]);
            pdf.roundedRect(cols[6] - 1, y - 3.5, 10, 5, 1, 1, 'F');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text(dpeLabel, cols[6] + 1.5, y);
            pdf.setFont('helvetica', 'normal');
          } else {
            pdf.text(dpeLabel, cols[6], y);
          }
          pdf.setTextColor(0, 0, 0);
          y += 6.5;
        }
      }

      // ═════════════════════════════════════════
      // SECTION 1 bis: COMPARATIF CONSO CALCULEES / REELLES
      // ═════════════════════════════════════════
      if (bats.length > 0) {
        y += 6;
        sectionTitle('Comparatif consommations calculees / reelles');

        checkPage(14);
        setFill(BLUE);
        pdf.rect(margin, y - 5, contentWidth, 8, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        const cCols = [margin + 3, margin + 60, margin + 100, margin + 140];
        pdf.text('Batiment', cCols[0], y - 0.5);
        pdf.text('Conso calculee (kWh/an)', cCols[1], y - 0.5);
        pdf.text('Conso reelle (kWh/an)', cCols[2], y - 0.5);
        pdf.text('Ecart', cCols[3], y - 0.5);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        let totCalc = 0;
        let totReel = 0;
        for (let i = 0; i < bats.length; i++) {
          const bat = bats[i];
          checkPage(7);
          if (i % 2 === 0) {
            setFill(GRAY_LIGHT);
            pdf.rect(margin, y - 4, contentWidth, 6.5, 'F');
          }
          const calc = bat.conso_calculee || 0;
          const reel = bat.conso_reelle || 0;
          totCalc += calc;
          totReel += reel;
          pdf.setFontSize(8);
          pdf.text((bat.designation || '').substring(0, 30), cCols[0], y);
          pdf.text(calc > 0 ? fmtNum(calc) : '-', cCols[1], y);
          pdf.text(reel > 0 ? fmtNum(reel) : '-', cCols[2], y);
          const pct = bat.ecart_conso_pct != null ? bat.ecart_conso_pct * 100 : null;
          if (pct !== null) {
            const absPct = Math.abs(pct);
            if (absPct <= 10) pdf.setTextColor(22, 163, 74);
            else if (absPct <= 20) pdf.setTextColor(217, 119, 6);
            else pdf.setTextColor(220, 38, 38);
            pdf.text(`${pct > 0 ? '+' : ''}${pct.toFixed(1)} %`, cCols[3], y);
            pdf.setTextColor(0, 0, 0);
          } else {
            pdf.text('-', cCols[3], y);
          }
          y += 6.5;
        }
        // Ligne TOTAL
        checkPage(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL', cCols[0], y);
        pdf.text(totCalc > 0 ? fmtNum(totCalc) : '-', cCols[1], y);
        pdf.text(totReel > 0 ? fmtNum(totReel) : '-', cCols[2], y);
        if (totReel > 0 && totCalc > 0) {
          const pctTot = ((totReel - totCalc) / totReel) * 100;
          pdf.text(`${pctTot > 0 ? '+' : ''}${pctTot.toFixed(1)} %`, cCols[3], y);
        }
        pdf.setFont('helvetica', 'normal');
        y += 7;
        pdf.setFontSize(7);
        setColor(GRAY);
        pdf.text('Ecart = (reelles - calculees) / reelles. Un ecart < 10 % valide les deperditions saisies.', margin + 3, y);
        pdf.setTextColor(0, 0, 0);
        y += 6;
      }

      // ═════════════════════════════════════════
      // SECTION 2: ETIQUETTES DPE
      // ═════════════════════════════════════════
      y += 6;
      sectionTitle('Etiquettes energetiques DPE');

      for (const bat of bats) {
        const dpeClasses = getDpeClasses(bat.typeBatiment);
        checkPage(90);

        subTitle(`${bat.designation} (${fmtNum(bat.surface_chauffee || 0)} m2)`);

        const barH = 7.5;
        const arrowTip = 5;
        for (let i = 0; i < dpeClasses.length; i++) {
          const cls = dpeClasses[i];
          const barW = 32 + i * 10;
          const isActive = cls.label === bat.etiquette_dpe;
          const bx = margin + 5;

          // Arrow bar + tip
          pdf.setFillColor(cls.color[0], cls.color[1], cls.color[2]);
          pdf.rect(bx, y, barW, barH, 'F');
          pdf.triangle(bx + barW, y, bx + barW + arrowTip, y + barH / 2, bx + barW, y + barH, 'F');

          // Letter
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(cls.label, bx + 3, y + 5.5);

          // Threshold
          const thX = bx + barW + arrowTip + 3;
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          setColor(GRAY);
          pdf.text(cls.max < 9999 ? `${cls.min} a ${cls.max}` : `> ${cls.min}`, thX, y + 5);

          if (isActive) {
            pdf.setDrawColor(30, 30, 30);
            pdf.setLineWidth(1.2);
            pdf.rect(bx - 0.5, y - 0.5, barW + arrowTip + 1.5, barH + 1);
            pdf.setLineWidth(0.2);
            // Value display
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            const consoText = `${Math.round(bat.conso_kwhep_per_m2 || 0)} kWh/m2/an`;
            pdf.text(consoText, thX + 28, y + 5.5);
          }

          y += barH + 1.2;
        }
        y += 8;
      }

      // ═════════════════════════════════════════
      // SECTION 3: ANALYSE FINANCIERE
      // ═════════════════════════════════════════
      newPage();
      sectionTitle('Analyse financiere');

      const chiffrageArr = calcData?.chiffrage || [];
      const parcAgrArr = calcData?.parcAgregation || [];
      const renderFinanceBlock = (chiff: any, parc: any, label?: string) => {
        if (label) subTitle(label);

        // Investment box
        checkPage(55);
        setFill(BLUE_LIGHT);
        pdf.roundedRect(margin, y - 5, contentWidth, 50, 2, 2, 'F');
        y += 1;
        addRow('Investissement reference HT', chiff?.investissement_ht != null ? fmtEur(chiff.investissement_ht) : 'N/A', { bold: true });
        addRow('Investissement biomasse HT', fmtEur(chiff?.investissement_bio_ht || 0));
        addRow('Subventions biomasse', fmtEur(chiff?.subventions_bio || 0), { color: GREEN_DARK });
        addRow('Net a investir (biomasse)', fmtEur((chiff?.investissement_bio_ht || 0) - (chiff?.subventions_bio || 0)), { bold: true });
        addRow('Annuite reference', chiff?.annuite != null ? fmtEur(chiff.annuite) : 'N/A');
        addRow('Annuite biomasse', fmtEur(chiff?.annuite_biomasse || 0));
        y += 5;

        // Cost comparison box
        if (parc) {
          checkPage(38);
          setFill(GREEN_LIGHT);
          pdf.roundedRect(margin, y - 5, contentWidth, 35, 2, 2, 'F');
          y += 1;
          addRow('Cout exploitation reference', fmtEur(parc.cout_total || 0) + '/an');
          addRow('Cout exploitation biomasse', fmtEur(parc.cout_biomasse || 0) + '/an');
          const eco = (parc.cout_total || 0) - (parc.cout_biomasse || 0);
          addRow('Economie annuelle', fmtEur(eco) + '/an', { bold: true, color: eco >= 0 ? GREEN_DARK : RED });
          // Temps de retour = surcout net d'investissement / economie d'exploitation
          // (meme formule que l'ecran : on exclut l'annuite qui rembourse l'investissement).
          const surcoutInvest = ((chiff?.investissement_bio_ht || 0) - (chiff?.subventions_bio || 0)) - (chiff?.investissement_ht || 0);
          const tr = eco > 0 ? surcoutInvest / eco : 0;
          const trLabel = (eco > 0 && surcoutInvest <= 0) ? 'immediat' : (tr > 0 ? `${tr.toFixed(1)} ans` : 'N/A');
          addRow('Temps de retour', trLabel, { bold: true, color: BLUE });
          y += 5;
        }
      };

      if (parcFilter != null) {
        const chiff = chiffrageArr.find((c: any) => c.parc === parcFilter);
        const parc = parcAgrArr.find((p: any) => p.parc === parcFilter);
        renderFinanceBlock(chiff, parc);
      } else if (chiffrageArr.length === 1) {
        renderFinanceBlock(chiffrageArr[0], parcAgrArr[0]);
      } else {
        for (const c of chiffrageArr) {
          const p = parcAgrArr.find((pa: any) => pa.parc === c.parc);
          renderFinanceBlock(c, p, `Parc ${c.parc}`);
        }
      }

      // ═════════════════════════════════════════
      // SECTION 4: BILAN 20 ANS
      // ═════════════════════════════════════════
      newPage();
      sectionTitle('Bilan actualise sur 20 ans');

      const bilan = parcFilter != null
        ? (calcData?.bilanParParc?.[parcFilter] || [])
        : (calcData?.bilanActualize || []);

      if (bilan.length > 0) {
        // Table header
        checkPage(14);
        setFill(BLUE);
        pdf.rect(margin, y - 5, contentWidth, 8, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        const bCols = [margin + 4, margin + 22, margin + 57, margin + 92, margin + 130];
        pdf.text('Annee', bCols[0], y - 0.5);
        pdf.text('Cout initial (EUR)', bCols[1], y - 0.5);
        pdf.text('Cout reference (EUR)', bCols[2], y - 0.5);
        pdf.text('Cout biomasse (EUR)', bCols[3], y - 0.5);
        pdf.text('Economie (EUR)', bCols[4], y - 0.5);
        y += 5;
        pdf.setFont('helvetica', 'normal');

        let totalEconomies = 0;
        for (let i = 0; i < bilan.length; i++) {
          const row = bilan[i];
          checkPage(6);
          // Zebra striping
          if (i % 2 === 0) {
            setFill(GRAY_LIGHT);
            pdf.rect(margin, y - 3.5, contentWidth, 5.5, 'F');
          }
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${row.annee}`, bCols[0], y);
          pdf.text(fmtEur(row.cout_initial || 0), bCols[1], y);
          pdf.text(row.cout_reference != null ? fmtEur(row.cout_reference) : 'N/A', bCols[2], y);
          pdf.text(fmtEur(row.cout_biomasse || 0), bCols[3], y);

          const eco = row.economies_bio_vs_ref || 0;
          totalEconomies += eco;
          pdf.setFont('helvetica', 'bold');
          if (eco >= 0) { setColor(GREEN_DARK); } else { setColor(RED); }
          pdf.text(fmtEur(eco), bCols[4], y);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          y += 5.5;
        }

        // Total bar
        y += 3;
        checkPage(14);
        setFill(GREEN_LIGHT);
        pdf.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, 'F');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        setColor(GREEN_DARK);
        pdf.text('Economies cumulees sur 20 ans :', margin + 8, y + 2);
        pdf.text(fmtEur(totalEconomies), pageWidth - margin - 8, y + 2, { align: 'right' });
        y += 12;
      }

      // ═════════════════════════════════════════
      // SECTION 5: IMPACT ENVIRONNEMENTAL
      // ═════════════════════════════════════════
      checkPage(50);
      y += 4;
      sectionTitle('Impact environnemental');

      setFill(GREEN_LIGHT);
      pdf.roundedRect(margin, y - 5, contentWidth, 24, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      y += 1;
      pdf.text('La solution biomasse permet une reduction significative des emissions', margin + 8, y);
      y += 6;
      pdf.text('de gaz a effet de serre par rapport aux solutions fossiles (fioul, gaz).', margin + 8, y);
      y += 6;
      setColor(GRAY);
      pdf.setFontSize(8);
      pdf.text('Donnees detaillees CO2 et SO2 disponibles dans l\'application.', margin + 8, y);

      // ─── Add footers to all pages ───
      const totalPages = pdf.getNumberOfPages();
      for (let p = 2; p <= totalPages; p++) {
        addFooterToPage(p);
      }

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
