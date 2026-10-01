import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

// Use inside <RequireAuth>: <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
export default function RequireRole({ roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
