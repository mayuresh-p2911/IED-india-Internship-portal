// ═══════════════════════════════════════════════════════════
// IED India IMS — Auth Context (React port of auth.js)
// ═══════════════════════════════════════════════════════════
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('ied_user');
    if (s) { try { return JSON.parse(s); } catch { return null; } }
    return null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ied_token'));

  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);
  const role = useMemo(() => user?.role, [user]);

  const login = useCallback(async (email, password) => {
    const data = await API.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ied_token', data.token);
    localStorage.setItem('ied_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await API.post('/auth/register', userData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ied_token', data.token);
    localStorage.setItem('ied_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ied_token');
    localStorage.removeItem('ied_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await API.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('ied_user', JSON.stringify(data.user));
    } catch {
      logout();
    }
  }, [logout]);

  const updateUser = useCallback((u) => {
    setUser(u);
    localStorage.setItem('ied_user', JSON.stringify(u));
  }, []);

  const is = useCallback((...roles) => roles.includes(user?.role), [user]);

  const value = useMemo(() => ({
    user, token, role, isAuthenticated,
    login, register, logout, refreshUser, updateUser, is
  }), [user, token, role, isAuthenticated, login, register, logout, refreshUser, updateUser, is]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
