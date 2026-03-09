import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Mono-client app - no auth required
    const { affaireId, email, role } = await req.json();

    // Create a sharing record (simplified - would need a Partage model in schema)
    // For now, return success with sharingId
    const sharingId = `share-${affaireId}-${Date.now()}`;

    return NextResponse.json({
      id: sharingId,
      affaireId,
      sharedWith: email,
      role: role || 'VIEWER',
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[POST /api/affaires/share]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Mono-client app - no auth required
    await req.json();

    // In a real implementation, delete from Partage table
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/affaires/share]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
