import { Link, useLocation } from 'react-router';
import { ClipboardCheck } from 'lucide-react';

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

        {!isHome && (
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Inicio
          </Link>
        )}
      </div>
    </header>
  );
}