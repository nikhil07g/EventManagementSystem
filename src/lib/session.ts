import type { UserProfile } from './api';

export type SessionKey = 'userSession' | 'organizerSession' | 'adminSession';

export interface StoredSession {
  token: string;
  user: UserProfile;
  loggedIn?: boolean;
  issuedAt?: number;
}

export const SESSION_KEYS: Record<'user' | 'organizer' | 'admin', SessionKey> = {
  user: 'userSession',
  organizer: 'organizerSession',
  admin: 'adminSession',
};

const parseSession = (value: string | null): StoredSession | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredSession;
    if (typeof parsed?.token !== 'string' || !parsed.user) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse session storage', error);
    return null;
  }
};

export const readSession = (key: SessionKey): StoredSession | null => {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  return parseSession(stored);
};

export const persistSession = (key: SessionKey, session: StoredSession): void => {
  if (typeof window === 'undefined') return;
  const payload: StoredSession = { ...session, issuedAt: Date.now(), loggedIn: true };
  window.localStorage.setItem(key, JSON.stringify(payload));
};

export const clearSession = (key: SessionKey): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
};

export const getAuthToken = (key: SessionKey): string | null => {
  const session = readSession(key);
  return session?.token ?? null;
};
