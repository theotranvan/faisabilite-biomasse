import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.meteoMonotone.findMany({
      distinct: ['ville'],
      select: { ville: true },
      orderBy: { ville: 'asc' },
    });
    const villes = result.map((r: any) => r.ville);
    return NextResponse.json(villes);
  } catch (error: any) {
    console.error('[GET /api/admin/meteo/villes]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
