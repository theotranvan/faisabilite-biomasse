import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const annee = parseInt(formData.get('annee') as string);

    if (!file || !annee || isNaN(annee)) {
      return NextResponse.json({ error: 'Fichier et année requis' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').slice(1).filter((l: any) => l.trim()); // skip header

    let count = 0;
    for (const line of lines) {
      const [departement, djuStr] = line.split(/[,;]/);
      const dju = parseFloat(djuStr);
      if (departement?.trim() && !isNaN(dju)) {
        await db.meteoDjuAnnuel.upsert({
          where: { departement_annee: { departement: departement.trim(), annee } },
          update: { dju },
          create: { departement: departement.trim(), annee, dju },
        });
        count++;
      }
    }

    // Recalculate averages
    const depts = await db.meteoDjuAnnuel.groupBy({
      by: ['departement'],
      _avg: { dju: true },
    });
    for (const dept of depts) {
      await db.meteoMoyenne.updateMany({
        where: { departement: dept.departement },
        data: { djuMoyenne: dept._avg.dju || 0 },
      });
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('[POST /api/admin/meteo/dju-import]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
