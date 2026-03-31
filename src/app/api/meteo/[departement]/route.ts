import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ departement: string }> }
) {
  try {
    const { departement } = await params;
    // Try by code first (e.g. "69"), then by name (e.g. "Rhône")
    const meteo = await db.meteoMoyenne.findFirst({
      where: {
        OR: [
          { code: departement },
          { departement },
        ],
      },
    });

    if (!meteo) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      departement,
      dju: meteo.djuMoyenne,
      tempExtBase: meteo.tempExtBase,
    });
  } catch (error) {
    console.error('[meteo/[departement]]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
