import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Page de création d'accès — réservée à l'admin (inscription sur invitation).
  // L'API /api/auth/register applique le même contrôle côté serveur.
  if (pathname === '/auth/register') {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    return NextResponse.next();
  }

  // Public routes — always allow
  if (
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(jpg|jpeg|png|gif|svg|ico|webp|css|js|woff|woff2)$/i.test(pathname)
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
