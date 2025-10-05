import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, type AuthUser, type LoginPayload, type ApiError } from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: ApiError | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(current => {
        if (active) {
          setUser(current);
        }
      })
      .catch(() => {
        if (active) { setUser(null); }
      })
      .finally(() => {
        if (active) { setIsLoading(false); }
      });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const authenticated = await apiLogin(payload);
      setUser(authenticated);
    } catch (err) {
      const apiError: ApiError = err instanceof Error
        ? Object.assign(err, { status: (err as ApiError).status ?? 0 }) as ApiError
        : Object.assign(new Error('Misslyckad inloggning'), { status: 0 });
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLogout();
      setUser(null);
    } catch (err) {
      const apiError: ApiError = err instanceof Error
        ? Object.assign(err, { status: (err as ApiError).status ?? 0 }) as ApiError
        : Object.assign(new Error('Misslyckad utloggning'), { status: 0 });
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback((...roles: string[]) => {
    if (!user) { return false; }
    if (roles.length === 0) { return true; }
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    error,
    login,
    logout,
    hasRole,
  }), [user, isLoading, error, login, logout, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* eslint-disable react-refresh/only-export-components */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext mÃ¥ste anvÃ¤ndas inom AuthProvider');
  }
  return context;
}
/* eslint-enable react-refresh/only-export-components */
