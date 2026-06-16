import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

// Le favicon est fourni par la convention de fichier Next.js : src/app/icon.jpg
export const metadata: Metadata = {
  title: 'Combiosol — Faisabilité Biomasse',
  description: 'Application de faisabilité technico-économique pour projets de chauffage biomasse',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50">
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
