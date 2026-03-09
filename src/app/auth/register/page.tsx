'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Layout';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    entreprise: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          entreprise: formData.entreprise || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'inscription');
        return;
      }

      router.push('/auth/login?registered=true');
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">🌱 Biomasse</h1>
        <p className="text-center text-sm text-gray-600 mb-6">Créer un compte</p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              placeholder="Jean"
              required
            />
            <Input
              label="Nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Dupont"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Entreprise (optionnel)"
            name="entreprise"
            value={formData.entreprise}
            onChange={handleChange}
            placeholder="Bureau d'études"
          />

          <Input
            label="Mot de passe"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            helpText="Min. 8 caractères"
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isLoading}
          >
            S'inscrire
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà inscrit?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
