import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const checks: Record<string, unknown> = {};

  // 1. Env vars
  checks.hasSecret = !!process.env.NEXTAUTH_SECRET;
  checks.secretLength = process.env.NEXTAUTH_SECRET?.length ?? 0;
  checks.nextauthUrl = process.env.NEXTAUTH_URL ?? '(not set)';
  checks.vercelUrl = process.env.VERCEL_URL ?? '(not set)';
  checks.nodeEnv = process.env.NODE_ENV ?? '(not set)';
  checks.hasDatabaseUrl = !!process.env.DATABASE_URL;
  checks.dbUrlProtocol = process.env.DATABASE_URL?.split('://')[0] ?? '(not set)';

  // 2. Database connectivity
  try {
    const userCount = await db.user.count();
    checks.dbConnection = 'OK';
    checks.userCount = userCount;
  } catch (e: any) {
    checks.dbConnection = 'FAILED';
    checks.dbError = e.message;
  }

  // 3. JWT token
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    checks.jwtToken = token ? { id: token.id, email: token.email, role: token.role } : null;
  } catch (e: any) {
    checks.jwtTokenError = e.message;
  }

  // 4. Server session
  try {
    const session = await getServerSession(authOptions);
    checks.serverSession = session ? { user: session.user } : null;
  } catch (e: any) {
    checks.serverSessionError = e.message;
  }

  // 5. Cookies present
  const cookieNames = req.cookies.getAll().map(c => c.name);
  checks.cookies = cookieNames;

  // 6. Request info
  checks.requestUrl = req.url;
  checks.host = req.headers.get('host');

  return NextResponse.json(checks, { status: 200 });
}
