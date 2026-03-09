import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Mono-client app - no auth required
    const { affaireId } = await req.json();

    // Fetch source affaire
    const sourceAffaire = await db.affaire.findFirst({
      where: { id: affaireId }
    });

    if (!sourceAffaire) {
      return NextResponse.json({ error: 'Affaire not found' }, { status: 404 });
    }

    // Create new affaire with simple ID (no uuid needed)
    const newAffaireId = `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAffaire = await db.affaire.create({
      data: {
        id: newAffaireId,
        userId: 'cmmgnvghb0044qugjmoilecnq',
        referenceAffaire: `${sourceAffaire.referenceAffaire}-COPY-${new Date().getTime()}`,
        nomClient: `${sourceAffaire.nomClient} (Copie)`,
        adresse: sourceAffaire.adresse,
        ville: sourceAffaire.ville,
        departement: sourceAffaire.departement,
        latitude: sourceAffaire.latitude,
        longitude: sourceAffaire.longitude,
        notes: sourceAffaire.notes,
        statut: 'BROUILLON',
        djuRetenu: sourceAffaire.djuRetenu,
        tempExtBase: sourceAffaire.tempExtBase,
        tempIntBase: sourceAffaire.tempIntBase,
        augmentationFossile: sourceAffaire.augmentationFossile,
        augmentationBiomasse: sourceAffaire.augmentationBiomasse,
        tauxEmprunt: sourceAffaire.tauxEmprunt,
        dureeEmprunt: sourceAffaire.dureeEmprunt,
      }
    });

    // Copy batiments
    const sourceBatiments = await db.batiment.findMany({
      where: { affaireId }
    });

    for (const bat of sourceBatiments) {
      await db.batiment.create({
        data: {
          affaireId: newAffaireId,
          numero: bat.numero,
          designation: bat.designation,
          typeBatiment: bat.typeBatiment,
          surfaceChauffee: bat.surfaceChauffee,
          volumeChauffe: bat.volumeChauffe,
          parc: bat.parc,
          deperditions: bat.deperditions,
          rendementProduction: bat.rendementProduction,
          rendementDistribution: bat.rendementDistribution,
          rendementEmission: bat.rendementEmission,
          rendementRegulation: bat.rendementRegulation,
          coefIntermittence: bat.coefIntermittence,
          consommationsCalculees: bat.consommationsCalculees,
          consommationsReelles: bat.consommationsReelles,
          typeEnergie: bat.typeEnergie,
          tarification: bat.tarification,
          abonnement: bat.abonnement,
          refDeperditions: bat.refDeperditions,
          refTypeEnergie: bat.refTypeEnergie,
          refRendementProduction: bat.refRendementProduction,
          refRendementDistribution: bat.refRendementDistribution,
          refRendementEmission: bat.refRendementEmission,
          refRendementRegulation: bat.refRendementRegulation,
        }
      });
    }

    // Copy parcs
    const sourceParcs = await db.parc.findMany({
      where: { affaireId }
    });

    for (const parc of sourceParcs) {
      await db.parc.create({
        data: {
          affaireId: newAffaireId,
          numero: parc.numero,
          puissanceChaudiereBois: parc.puissanceChaudiereBois,
          rendementChaudiereBois: parc.rendementChaudiereBois,
          puissanceChaudiere2: parc.puissanceChaudiere2,
          rendementChaudiere2: parc.rendementChaudiere2,
          typeBiomasse: parc.typeBiomasse,
          longueurReseau: parc.longueurReseau,
          sectionReseau: parc.sectionReseau,
          pourcentageCouvertureBois: parc.pourcentageCouvertureBois,
        }
      });
    }

    // Copy chiffrage reference and biomasse for each parc
    const newParcs = await db.parc.findMany({
      where: { affaireId: newAffaireId }
    });

    for (const newParc of newParcs) {
      const sourceParc = sourceParcs.find(p => p.numero === newParc.numero);
      if (!sourceParc) continue;

      // Copy chiffrage reference
      const sourceChiffragRef = await db.chiffragReference.findFirst({
        where: { parcId: sourceParc.id }
      });

      if (sourceChiffragRef) {
        await db.chiffragReference.create({
          data: {
            parcId: newParc.id,
            lignesIsolation: sourceChiffragRef.lignesIsolation,
            lignesChaufferie: sourceChiffragRef.lignesChaufferie,
            tauxBureauControle: sourceChiffragRef.tauxBureauControle,
            tauxMaitriseOeuvre: sourceChiffragRef.tauxMaitriseOeuvre,
            tauxFraisDivers: sourceChiffragRef.tauxFraisDivers,
            tauxAleas: sourceChiffragRef.tauxAleas,
          }
        });
      }

      // Copy chiffrage biomasse
      const sourceChiffragBio = await db.chiffrageBiomasse.findFirst({
        where: { parcId: sourceParc.id }
      });

      if (sourceChiffragBio) {
        await db.chiffrageBiomasse.create({
          data: {
            parcId: newParc.id,
            vrd: sourceChiffragBio.vrd,
            grosOeuvre: sourceChiffragBio.grosOeuvre,
            charpenteCouverture: sourceChiffragBio.charpenteCouverture,
            processBois: sourceChiffragBio.processBois,
            chaudiereAppoint: sourceChiffragBio.chaudiereAppoint,
            hydrauliqueChaufferie: sourceChiffragBio.hydrauliqueChaufferie,
            reseauChaleurQte: sourceChiffragBio.reseauChaleurQte,
            reseauChaleurPU: sourceChiffragBio.reseauChaleurPU,
            sousStation: sourceChiffragBio.sousStation,
            installationReseau: sourceChiffragBio.installationReseau,
            autresTravaux: sourceChiffragBio.autresTravaux,
            tauxBureauControle: sourceChiffragBio.tauxBureauControle,
            tauxMaitriseOeuvre: sourceChiffragBio.tauxMaitriseOeuvre,
            tauxFraisDivers: sourceChiffragBio.tauxFraisDivers,
            tauxAleas: sourceChiffragBio.tauxAleas,
            tauxSubventionCotEnr: sourceChiffragBio.tauxSubventionCotEnr,
            tauxAideDepartementale: sourceChiffragBio.tauxAideDepartementale,
          }
        });
      }
    }

    return NextResponse.json(newAffaire);
  } catch (error: any) {
    console.error('[POST /api/affaires/duplicate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
