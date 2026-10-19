import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import Button from './Button.jsx';
import UserAvatar from './profile/UserAvatar.jsx';
import PersonModal from './ui/PersonModal.jsx';
import { HEADER_FIELDS } from '../constants/questionnaires.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../constants/roles.js';
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
      En curso · {audit.answered}/{audit.questions ?? audit.total}
    </span>
  );
}

const PHOTO_COLUMN = { oficina: 'evaluatedPerson' };

export default function AuditTable({ questionnaireKey, audits, users = [] }) {
  const columns = AUDIT_COLUMNS[questionnaireKey];
  const theme = ACCENT_THEME;
  const photoColumn = PHOTO_COLUMN[questionnaireKey];
  const userOf = a =>
    users.find(u => (a.evaluated ? u.id === a.evaluated : u.name === a.evaluatedPerson)) ?? { name: a.evaluatedPerson || '?' };
  const [person, setPerson] = useState(null);
  const canEvaluate = useAuth().user.role === ROLES.ADMIN;

  return (
    <>
    <PersonModal user={person} onClose={() => setPerson(null)} />
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
                {columns.map(([key]) => (
                  <td key={key} className="px-4 py-3 text-text">
                    {key === photoColumn ? (
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPerson(userOf(a))}
                          aria-label={`Ver a ${userOf(a).name}`}
                          className="shrink-0 rounded-full transition-all hover:ring-2 hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <UserAvatar user={userOf(a)} size={28} />
                        </button>
                        {a[key] || '—'}
                      </span>
                    ) : (a[key] || '—')}
                  </td>
                ))}
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${done ? theme.label : 'text-text-faint'}`}>
                  {done ? `${a.score} / ${a.total}` : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge audit={a} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    {!done && canEvaluate && (
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
    </>
  );
}
