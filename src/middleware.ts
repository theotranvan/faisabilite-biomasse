import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — always allow
  if (
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // API routes without a token → return JSON 401
  if (pathname.startsWith('/api/') && !token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Non-API routes without a token → redirect to login
  if (!pathname.startsWith('/api/') && !token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Admin routes require ADMIN role
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname === '/couts') {
    if (token?.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
