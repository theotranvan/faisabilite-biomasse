import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Faisabilité Biomasse',
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
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
