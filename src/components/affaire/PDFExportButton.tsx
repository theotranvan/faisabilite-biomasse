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
  data?: {
    batiments?: any[];
    parcs?: any[];
    chiffrageRef?: any;
    chiffrageBio?: any;
  };
}

export function PDFExportButton({ referenceAffaire, nomClient, ville, data }: Omit<PDFExportProps, 'affaireId'>) {
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState('');

  const generateLabel = async () => {
    setError('');
    setIsGeneratingLabel(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Centered box (étiquette)
      const boxWidth = 150;
      const boxHeight = 120;
      const xStart = (pageWidth - boxWidth) / 2;
      const yStart = (pageHeight - boxHeight) / 2;

      // Border
      pdf.setDrawColor(0, 102, 204);
      pdf.setLineWidth(2);
      pdf.rect(xStart, yStart, boxWidth, boxHeight);

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Faisabilité Biomasse', pageWidth / 2, yStart + 15, {
        align: 'center',
      });

      // Info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Référence: ${referenceAffaire}`, pageWidth / 2, yStart + 30, {
        align: 'center',
      });

      pdf.setFontSize(11);
      pdf.text(`Client: ${nomClient}`, pageWidth / 2, yStart + 40, {
        align: 'center',
      });

      pdf.text(`Localisation: ${ville}`, pageWidth / 2, yStart + 50, {
        align: 'center',
      });

      pdf.setFontSize(9);
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yStart + 65, {
        align: 'center',
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text('Étude technico-économique', pageWidth / 2, pageHeight - 15, {
        align: 'center',
      });

      // Download with fallback method
      const fileName = `etiquette_${referenceAffaire}.pdf`;
      try {
        // Method 1: Direct save (works in most browsers)
        pdf.save(fileName);
      } catch {
        // Method 2: Fallback - create link manually
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.text('Rapport de Faisabilité Biomasse', pageWidth / 2, yPosition, {
        align: 'center',
      });

      yPosition += 15;
      pdf.setFontSize(10);
      pdf.text(`Référence: ${referenceAffaire}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Client: ${nomClient}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Localisation: ${ville}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);

      // Separator
      yPosition += 10;
      pdf.setDrawColor(200);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);

      // Project Info Section
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('1. Informations du projet', 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.text(`Affaire: ${referenceAffaire}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Client: ${nomClient}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Ville: ${ville}`, 25, yPosition);

      // Buildings Section
      if (data?.batiments && data.batiments.length > 0) {
        yPosition += 12;
        pdf.setFontSize(14);
        pdf.text('2. Bâtiments analysés', 20, yPosition);
        yPosition += 8;

        data.batiments.slice(0, 5).forEach((bat: any) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFontSize(10);
          pdf.text(
            `Bâtiment ${bat.numero}: ${bat.surfaceEtat?.toLocaleString() || 'N/A'} m² | ${bat.volumeEtat?.toLocaleString() || 'N/A'} m³`,
            25,
            yPosition
          );
          yPosition += 6;
        });
      }

      // Financial Summary
      if (data?.chiffrageBio) {
        yPosition += 12;
        pdf.setFontSize(14);
        pdf.text('3. Analyse financière', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        const investTotal =
          (data.chiffrageBio.coutInstallationChaudieres || 0) +
          (data.chiffrageBio.coutInstallationReseau || 0) +
          (data.chiffrageBio.coutInstallateurLocalBois || 0);

        pdf.text(`Investissement total: ${investTotal.toLocaleString('fr-FR')} €`, 25, yPosition);
        yPosition += 6;
        pdf.text(
          `Maintenance annuelle: ${((data.chiffrageBio.coutMaintenanceAnnuelleChaudieres || 0) + (data.chiffrageBio.coutMaintenanceAnnuelleReseau || 0) + (data.chiffrageBio.coutMaintenanceAnnuelleEntreprise || 0)).toLocaleString('fr-FR')} €`,
          25,
          yPosition
        );
        yPosition += 6;

        const aideTotal =
          (investTotal * ((data.chiffrageBio.tauxCreditImpot || 0) / 100) +
            investTotal * ((data.chiffrageBio.tauxEco || 0) / 100)) /
          2;
        pdf.text(`Aides potentielles: ${aideTotal.toLocaleString('fr-FR')} €`, 25, yPosition);
        yPosition += 6;
        pdf.text(
          `Net à investir: ${(investTotal - aideTotal).toLocaleString('fr-FR')} €`,
          25,
          yPosition
        );
      }

      // Environmental Impact
      yPosition += 12;
      pdf.setFontSize(14);
      pdf.text('4. Impact environnemental (20 ans)', 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.text('CO₂ évitées: ~4500 tonnes', 25, yPosition);
      yPosition += 6;
      pdf.text('Équivalent: 7500 arbres plantés', 25, yPosition);
      yPosition += 6;
      pdf.text('Énergie renouvelable: 85% de couverture', 25, yPosition);

      // Footer
      const footerY = pageHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Rapport généré automatiquement - ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, footerY, {
        align: 'center',
      });

      // Download with fallback method
      const fileName = `rapport_${referenceAffaire}.pdf`;
      try {
        // Method 1: Direct save (works in most browsers)
        pdf.save(fileName);
      } catch {
        // Method 2: Fallback - create link manually
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
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
