'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { Button, Input } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Layout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
        setIsLoading(false);
      } else if (result?.ok) {
        setAnimating(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1200);
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      {/* Zoom overlay — fills screen with white when animating */}
      <div
        className="fixed inset-0 bg-white z-50 pointer-events-none"
        style={{
          opacity: animating ? 1 : 0,
          transition: 'opacity 0.6s ease-in 0.6s',
        }}
      />

      <div
        className="max-w-md w-full bg-white rounded-lg shadow p-8 relative"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'scale(0.9)' : 'scale(1)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      >
        {/* Logo — zooms in on success */}
        <div className="flex justify-center mb-4">
          <img
            ref={logoRef}
            src="/logo-combiosol.jpg"
            alt="Combiosol"
            className="h-20 w-auto rounded-xl"
            style={{
              position: animating ? 'fixed' : 'relative',
              top: animating ? '50%' : 'auto',
              left: animating ? '50%' : 'auto',
              transform: animating
                ? 'translate(-50%, -50%) scale(12)'
                : 'translate(0, 0) scale(1)',
              zIndex: animating ? 60 : 1,
              transition: animating
                ? 'transform 1.1s cubic-bezier(0.4, 0, 0.2, 1), top 0.01s, left 0.01s, position 0.01s'
                : 'none',
              borderRadius: animating ? '0' : '0.75rem',
            }}
          />
        </div>

        <h1
          className="text-2xl font-bold mb-1 text-center text-gray-900"
          style={{
            opacity: animating ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          Combiosol
        </h1>
        <p
          className="text-center text-sm text-gray-600 mb-6"
          style={{
            opacity: animating ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          Faisabilité technico-économique biomasse
        </p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(20px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.6 18.6 0 0 1 4.22-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isLoading}
            disabled={animating}
          >
            Se connecter
          </Button>
        </form>

      </div>
    </div>
  );
}
