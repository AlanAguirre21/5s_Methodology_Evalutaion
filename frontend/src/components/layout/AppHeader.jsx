import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { LogOut, UserPlus } from 'lucide-react';
import SM_logo from '../../../public/SF_logo.svg';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';

const linkClass = ({ isActive }) =>
  `rounded-control px-3 py-1.5 text-sm font-medium transition-all ${
    isActive ? 'neu-raised bg-white/60 text-accent' : 'text-text-muted hover:bg-white/50 hover:text-text'
  }`;

export default function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isHome = pathname === '/';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="glass shrink-0 border-b border-white/40 bg-white/40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-20">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Ir al inicio">
          <img src={SM_logo} alt="" className="h-12 w-auto sm:h-16" />
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            <NavLink to="/personas" className={linkClass}>
              <span className="hidden sm:inline">Elementos de auditoría</span>
              <span className="sm:hidden">Elementos</span>
            </NavLink>
            <NavLink to="/registro" className={linkClass}>
              <span className="hidden sm:inline">Registro de evaluaciones</span>
              <span className="sm:hidden">Evaluaciones</span>
            </NavLink>
            {!isHome && (
              <NavLink to="/" end className={linkClass}>
                Inicio
              </NavLink>
            )}
            {user.role === ROLES.ADMIN && (
              <NavLink to="/usuarios/nuevo" className={linkClass} aria-label="Nuevo usuario" title="Nuevo usuario">
                <UserPlus size={16} />
              </NavLink>
            )}

            <span
              className="ml-2 hidden max-w-50 truncate border-l border-border-strong pl-3 text-sm text-muted md:inline"
              title={`${user.username} · ${ROLE_LABELS[user.role]}`}
            >
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title={`Cerrar sesión (${user.username})`}
              className="rounded-control p-2 text-text-muted transition-all hover:bg-white/50 hover:text-danger"
            >
              <LogOut size={16} />
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
