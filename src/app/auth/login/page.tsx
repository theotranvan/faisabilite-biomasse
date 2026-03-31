'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button, Input } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Layout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [debugInfo, setDebugInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setDebugInfo(JSON.stringify(result, null, 2));

      if (result?.error) {
        setError(`Erreur: ${result.error}`);
      } else if (result?.ok) {
        // Force a hard navigation to ensure cookies are sent
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`);
      setDebugInfo(err.stack || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">🌱 Biomasse</h1>
        <p className="text-center text-sm text-gray-600 mb-6">Faisabilité technico-économique</p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isLoading}
          >
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Pas encore inscrit?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-semibold">
            S'inscrire
          </Link>
        </p>

        {debugInfo && (
          <pre className="mt-4 p-3 bg-gray-100 text-xs text-gray-800 rounded overflow-auto max-h-40">
            {debugInfo}
          </pre>
        )}
      </div>
    </div>
  );
}
