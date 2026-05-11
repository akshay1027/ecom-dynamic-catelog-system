import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

async function fetchMe() {
  const res = await fetch('/api/v1/auth/me', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.success ? body.data : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then(data => { if (!cancelled) { setUser(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!body.success) {
      const err = new Error(body.error?.message || 'Login failed');
      err.code = body.error?.code;
      throw err;
    }
    setUser(body.data);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
