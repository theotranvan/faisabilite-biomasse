import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { departement: string } }
) {
  try {
    const meteo = await db.meteoMoyenne.findUnique({
      where: { departement: params.departement },
    });

    if (!meteo) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      departement: meteo.departement,
      dju: meteo.djuMoyenne,
    });
  } catch (error) {
    console.error('[meteo/[departement]]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
