import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

// { user, login(email), logout(), updateUser(user) } — user is null when nobody is identified
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
