import { Link, NavLink, useLocation } from 'react-router';
import SM_logo from '../../../public/SF_logo.svg';

const linkClass = ({ isActive }) =>
  `rounded-control px-3 py-1.5 text-sm font-medium transition-all ${
    isActive ? 'neu-raised bg-white/60 text-accent' : 'text-text-muted hover:bg-white/50 hover:text-text'
  }`;

export default function AppHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <header className="glass shrink-0 border-b border-white/40 bg-white/40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-20">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Ir al inicio">
          <img src={SM_logo} alt="" className="h-12 w-auto sm:h-16" />
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/personas" className={linkClass}>
            <span className="hidden sm:inline">Elementos de auditoría</span>
            <span className="sm:hidden">Personas</span>
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
        </nav>
      </div>
    </header>
  );
}
