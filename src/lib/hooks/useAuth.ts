'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = role === 'ADMIN';

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push('/dashboard');
    }

    return result;
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    role,
    isAdmin,
    login,
    logout,
    session,
  };
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  if (auth.isLoading) return { isLoading: true };

  if (!auth.isAuthenticated) {
    router.push('/auth/login');
    return { isLoading: true };
  }

  return {
    isLoading: false,
    user: auth.user,
  };
}
