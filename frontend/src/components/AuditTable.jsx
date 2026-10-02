import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import Button from './Button.jsx';
import { HEADER_FIELDS } from '../constants/questionnaires.js';
import { PANEL, ACCENT_THEME } from '../constants/styles.js';

export const AUDIT_COLUMNS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([type, fields]) => [type, fields.map(f => [f.key, f.label])])
);

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

function StatusBadge({ audit }) {
  if (audit.status === 'completed') {
    return <span className="rounded-full border border-white/60 bg-white/60 px-2 py-0.5 text-xs font-medium text-text-muted">{audit.result ?? 'Completada'}</span>;
  }
  return (
    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent ring-1 ring-accent/30">
      En curso · {audit.answered}/{audit.total}
    </span>
  );
}

export default function AuditTable({ questionnaireKey, audits }) {
  const columns = AUDIT_COLUMNS[questionnaireKey];
  const theme = ACCENT_THEME;

  return (
    <div className={`overflow-x-auto ${PANEL}`}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-white/60 text-xs   text-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            {columns.map(([key, label]) => <th key={key} className="px-4 py-3 font-medium">{label}</th>)}
            <th className="px-4 py-3 text-right font-medium">Puntaje</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3"><span className="sr-only">Abrir</span></th>
          </tr>
        </thead>
        <tbody className=" ">
          {audits.map(a => {
            const done = a.status === 'completed';
            return (
              <tr key={a.auditId} className="border-b border-white/40 hover:bg-white/50">
                <td className="whitespace-nowrap px-4 py-3 text-text-muted">{dateFormat.format(new Date(a.completedAt ?? a.createdAt))}</td>
                {columns.map(([key]) => <td key={key} className="px-4 py-3 text-text">{a[key] || '—'}</td>)}
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${done ? theme.label : 'text-text-faint'}`}>
                  {done ? `${a.score} / ${a.total}` : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge audit={a} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    {!done && (
                      <Button as={Link} to={`/audits/${a.auditId}`} variant="success" size="sm">
                        Continuar
                      </Button>
                    )}
                    <Link to={`/registro/${a.auditId}`} className="inline-flex items-center gap-0.5 font-medium text-text-muted hover:text-text">
                      Ver evaluación <ChevronRight size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
