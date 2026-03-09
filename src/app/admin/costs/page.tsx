'use client';

import Header from '@/components/shared/Header';
import { CostsDatabaseManager } from '@/components/admin/CostsDatabaseManager';

export const dynamic = 'force-dynamic';

export default function AdminCostsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Base de données des coûts</h1>
          <p className="text-gray-600 mt-2">Gérez les coûts de référence pour vos analyses</p>
        </div>

        <CostsDatabaseManager />
      </main>
    </div>
  );
}
