'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { api, configureApiAuth } from './api';
import type { TokenPair, User } from './types';

interface SessionState extends Partial<TokenPair> {
  user: User | null;
}

interface AuthContextValue {
  ready: boolean;
  user: User | null;
  accessToken: string | null;
  login: (params: { identifier: string; password: string; role: 'teacher' | 'student' }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
}

const publicPaths = new Set(['/login']);
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionState>({ user: null });
  const refreshTokenRef = useRef<string | null>(null);

  useEffect(() => {
    refreshTokenRef.current = session.refresh_token ?? null;
  }, [session.refresh_token]);

  async function refreshSessionInternal(): Promise<string | null> {
    try {
      const tokens = await api.refreshToken(refreshTokenRef.current);
      setSession((current) => ({
        ...current,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }));
      return tokens.access_token;
    } catch {
      setSession({ user: null });
      return null;
    }
  }

  useEffect(() => {
    configureApiAuth({
      refreshSession: refreshSessionInternal,
      onAuthFailure: () => {
        setSession({ user: null });
        router.replace('/login');
      },
    });
  }, [router]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await api.me();
        setSession((current) => ({ ...current, user, access_token: current.access_token ?? 'cookie-session' }));
      } catch {
        const nextToken = await refreshSessionInternal();
        if (!nextToken) {
          setReady(true);
          return;
        }
        try {
          const user = await api.me(nextToken);
          setSession((current) => ({ ...current, user, access_token: nextToken }));
        } catch {
          setSession({ user: null });
        }
      } finally {
        setReady(true);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const isPublic = publicPaths.has(pathname);
    if (!session.user && !isPublic) {
      router.replace('/login');
      return;
    }

    if (session.user && (pathname === '/login' || pathname === '/')) {
      router.replace('/dashboard');
    }
  }, [pathname, ready, router, session.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user: session.user,
      accessToken: session.access_token ?? null,
      async login({ identifier, password, role }) {
        const tokens = await api.moodleLogin(identifier, password, role);
        const user = await api.me(tokens.access_token);
        setSession({
          user,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        router.replace('/dashboard');
      },
      async logout() {
        try {
          await api.logout();
        } finally {
          setSession({ user: null });
          router.replace('/login');
        }
      },
      async logoutAll() {
        try {
          await api.logoutAllSessions();
        } finally {
          setSession({ user: null });
          router.replace('/login');
        }
      },
      async refreshUser() {
        let token = session.access_token ?? null;
        if (!token) {
          token = await refreshSessionInternal();
          if (!token) {
            router.replace('/login');
            return;
          }
        }
        const user = await api.me(token);
        setSession((current) => ({ ...current, user, access_token: token ?? current.access_token ?? 'cookie-session' }));
      },
      refreshSession: refreshSessionInternal,
    }),
    [ready, router, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
