import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ville = (formData.get('ville') as string)?.trim();

    if (!file || !ville) {
      return NextResponse.json({ error: 'Fichier et nom de ville requis' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter((l: any) => l.trim());
    const startIdx = isNaN(parseFloat(lines[0])) ? 1 : 0;

    const records = lines.slice(startIdx).map((line: any, i: any) => ({
      ville,
      heure: i,
      temperatureExt: parseFloat(line.trim()) || 0,
    }));

    // Delete existing data for this city
    await db.meteoMonotone.deleteMany({ where: { ville } });
    // Insert new data
    await db.meteoMonotone.createMany({ data: records });

    return NextResponse.json({ success: true, ville, heures: records.length });
  } catch (error: any) {
    console.error('[POST /api/admin/meteo/monotone-import]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
