import { NextRequest, NextResponse } from 'next/server';
import { db, getSessionUserId } from '@/lib/db';
import { canAccessAffaire } from '@/lib/authz';

export async function POST(req: NextRequest) {
  try {
    const { affaireId } = await req.json();

    // Fetch source affaire — accès limité au périmètre de l'utilisateur
    if (!(await canAccessAffaire(affaireId))) {
      return NextResponse.json({ error: 'Affaire not found' }, { status: 404 });
    }
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
        userId: await getSessionUserId(),
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
        villeMonotone: sourceAffaire.villeMonotone,
        tarifFuelExploitation: sourceAffaire.tarifFuelExploitation,
        tarifGazExploitation: sourceAffaire.tarifGazExploitation,
        tarifBoisExploitation: sourceAffaire.tarifBoisExploitation,
        tarifElecExploitation: sourceAffaire.tarifElecExploitation,
      }
    });

    // Copy batiments
    const sourceBatiments = await db.batiment.findMany({
      where: { affaireId },
      include: { travauxIsolation: { include: { lignes: true } } }
    });

    for (const bat of sourceBatiments) {
      const newBat = await db.batiment.create({
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
          refTarification: bat.refTarification,
          refAbonnement: bat.refAbonnement,
        }
      });

      // Copy travaux d'isolation
      if (bat.travauxIsolation) {
        const newTravaux = await db.travauxIsolation.create({
          data: {
            batimentId: newBat.id,
          }
        });
        for (const ligne of bat.travauxIsolation.lignes) {
          await db.travauxIsolationLigne.create({
            data: {
              travauxIsolationId: newTravaux.id,
              designation: ligne.designation,
              unite: ligne.unite,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
              dejaRealise: ligne.dejaRealise,
            }
          });
        }
      }
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
          volumeCamion: parc.volumeCamion,
          volumeSilo: parc.volumeSilo,
          kmHaieAn: parc.kmHaieAn,
          stereAn: parc.stereAn,
          combustibleAppoint: parc.combustibleAppoint,
        }
      });
    }

    // Copy chiffrage reference and biomasse for each parc
    const newParcs = await db.parc.findMany({
      where: { affaireId: newAffaireId }
    });

    for (const newParc of newParcs) {
      const sourceParc = sourceParcs.find((p: any) => p.numero === newParc.numero);
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
            empruntRef: sourceChiffragRef.empruntRef,
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
            tauxDetrDsil: sourceChiffragBio.tauxDetrDsil,
            subventionComplementaire: sourceChiffragBio.subventionComplementaire,
            montantP2: sourceChiffragBio.montantP2,
            consoElecSupplementaire: sourceChiffragBio.consoElecSupplementaire,
            empruntBio: sourceChiffragBio.empruntBio,
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
