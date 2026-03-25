import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // API routes without a token → return JSON 401 (not HTML redirect)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public pages — always allow
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/')
        ) {
          return true;
        }

        // Let API routes through to the middleware function above,
        // which returns JSON 401 instead of HTML redirect
        if (pathname.startsWith('/api/')) {
          return true;
        }

        // Everything else requires authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protect all pages except static assets and auth
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
