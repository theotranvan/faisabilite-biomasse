import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ville: string } }
) {
  try {
    const data = await db.meteoMonotone.findMany({
      where: { ville: params.ville },
      orderBy: { heure: 'asc' },
      select: { temperatureExt: true },
    });

    if (data.length === 0) {
      return NextResponse.json(
        { error: `No data found for ville: ${params.ville}` },
        { status: 404 }
      );
    }

    return NextResponse.json(data.map((d: any) => d.temperatureExt));
  } catch (error) {
    console.error('[meteo/monotone/GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
