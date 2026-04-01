'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import clsx from 'clsx';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdminUser = userRole === 'ADMIN';

  // Ne pas afficher le bouton retour sur la page d'accueil ou dashboard
  const showBackButton = !['/dashboard', '/', '/accueil', '/affaires'].includes(pathname);

  const navLinks = [
    { href: '/dashboard', label: 'Accueil', match: (p: string) => p === '/' || p === '/dashboard' },
    { href: '/affaires', label: 'Mes affaires', match: (p: string) => p === '/affaires' },
    { href: '/affaires/new', label: 'Nouvelle étude', match: (p: string) => p === '/affaires/new' },
    ...(isAdminUser ? [
      { href: '/couts', label: 'BDD Coûts', match: (p: string) => p === '/couts' },
      { href: '/admin/meteo', label: 'Météo', match: (p: string) => p.startsWith('/admin/meteo') },
    ] : []),
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo-combiosol.jpg" alt="Combiosol" className="h-9 w-9 object-contain" />
            <span className="font-bold text-gray-900 text-lg tracking-tight">Combiosol</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition',
                  link.match(pathname)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex gap-2 items-center">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
            >
              ← Retour
            </button>
          )}
          {session?.user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              {isAdminUser && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                  Admin
                </span>
              )}
              <span className="text-sm text-gray-500">{session.user.name || session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface SidebarProps {
  items: Array<{
    label: string;
    href: string;
    icon?: string;
  }>;
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200">
      <nav className="p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block px-4 py-2 rounded-md text-sm font-medium transition',
              pathname === item.href
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-700 hover:bg-gray-200'
            )}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function BreadCrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="text-blue-600 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Header;
