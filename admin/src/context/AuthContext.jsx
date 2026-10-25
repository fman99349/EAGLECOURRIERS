import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eagle_token');
    const stored = localStorage.getItem('eagle_admin');

    if (token && stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        localStorage.removeItem('eagle_admin');
      }
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    const { token, admin: adminData } = res.data;
    localStorage.setItem('eagle_token', token);
    localStorage.setItem('eagle_admin', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  }

  function logout() {
    localStorage.removeItem('eagle_token');
    localStorage.removeItem('eagle_admin');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}