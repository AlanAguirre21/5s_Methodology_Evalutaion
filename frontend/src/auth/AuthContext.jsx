import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../hooks/useAuth.js';
import { clearSession, getSession, getToken, saveSession } from './session.js';
import * as authApi from '../api/auth.js';

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession);   // { token, user } | null

  const login = useCallback(async username => {
    const next = await authApi.login(username);
    saveSession(next);
    setSession(next);
    return next.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // api/client.js fires this when the backend no longer recognises the stored user
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  // Refresh the stored user on load, in case its name or role changed
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let active = true;

    authApi.getMe()
      .then(user => {
        if (!active || getToken() !== token) return;
        saveSession({ token, user });
        setSession({ token, user });
      })
      .catch(() => { /* offline: keep the stored user; a 401 already fired auth:expired */ });

    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ user: session?.user ?? null, login, logout }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
