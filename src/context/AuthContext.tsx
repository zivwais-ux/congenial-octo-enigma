import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Author } from '@/types';
import { getBackend } from '@/services';
import type { AuthProvider, ProfilePatch, Session } from '@/services';

interface AuthContextValue {
  user: Author | null;
  session: Session | null;
  initializing: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signInWithProvider: (provider: AuthProvider) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = getBackend();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    backend.auth
      .getSession()
      .then((s) => {
        if (active) setSession(s);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [backend]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setSession(await backend.auth.signInWithEmail(email, password));
    },
    [backend],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      setSession(
        await backend.auth.signUpWithEmail(email, password, displayName),
      );
    },
    [backend],
  );

  const signInWithProvider = useCallback(
    async (provider: AuthProvider) => {
      setSession(await backend.auth.signInWithProvider(provider));
    },
    [backend],
  );

  const continueAsGuest = useCallback(async () => {
    setSession(await backend.auth.continueAsGuest());
  }, [backend]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      const user = await backend.auth.updateProfile(patch);
      setSession((prev) => (prev ? { ...prev, user } : prev));
    },
    [backend],
  );

  const signOut = useCallback(async () => {
    await backend.auth.signOut();
    setSession(null);
  }, [backend]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      initializing,
      isAuthenticated: !!session,
      signInWithEmail,
      signUpWithEmail,
      signInWithProvider,
      continueAsGuest,
      updateProfile,
      signOut,
    }),
    [
      session,
      initializing,
      signInWithEmail,
      signUpWithEmail,
      signInWithProvider,
      continueAsGuest,
      updateProfile,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
