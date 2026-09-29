import { Link, NavLink, useLocation } from 'react-router';
import { ClipboardCheck } from 'lucide-react';

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
  }`;

export default function AppHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-white">
            <ClipboardCheck size={18} />
          </span>
          <span className="font-semibold text-slate-800">Evaluación 5S</span>
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink to="/personas" className={linkClass}>
            Registro de personas
          </NavLink>
          <NavLink to="/registro" className={linkClass}>
            Registro de evaluaciones
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