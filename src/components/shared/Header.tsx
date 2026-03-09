'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Ne pas afficher le bouton retour sur la page d'accueil ou dashboard
  const showBackButton = !['/dashboard', '/', '/accueil'].includes(pathname);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-blue-600 text-xl hover:text-blue-700">
            🌱 Faisabilité Biomasse
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link
              href="/affaires"
              className={clsx(
                'text-sm font-medium transition',
                pathname.startsWith('/affaires')
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Affaires
            </Link>
            <Link
              href="/couts"
              className={clsx(
                'text-sm font-medium transition',
                pathname === '/couts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Coûts
            </Link>
          </nav>
        </div>

        <div className="flex gap-3 items-center">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition"
              title="Retour à la page précédente"
            >
              ← Retour
            </button>
          )}
          <Link
            href="/affaires/new"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            + Nouvelle étude
          </Link>
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
