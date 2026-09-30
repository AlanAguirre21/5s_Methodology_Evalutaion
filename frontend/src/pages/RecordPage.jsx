import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { listAudits } from '../api/audits.js';
import { QUESTIONNAIRE_OPTIONS, HEADER_FIELDS } from '../constants/questionnaires.js';
import { PANEL, SEGMENTED, TYPE_THEMES } from '../constants/styles.js';
import Button from '../components/Button.jsx';
import { Select } from '../components/Input.jsx';

const COLUMNS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([type, fields]) => [type, fields.map(f => [f.key, f.label])])
);

const PAGE_SIZES = [10, 25, 50, 100, 0];   // 0 = all rows

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

function AuditTable({ questionnaireKey, audits }) {
  const columns = COLUMNS[questionnaireKey];
  const theme = TYPE_THEMES[questionnaireKey];

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

export default function RecordPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = QUESTIONNAIRE_OPTIONS.some(o => o.key === tabParam) ? tabParam : QUESTIONNAIRE_OPTIONS[0].key;

  const [audits, setAudits]     = useState(null);  
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState({});     
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage]         = useState(0);

  useEffect(() => {
    let active = true;
    setAudits(null);
    setError(null);
    setFilters({});  
    setPage(0);

    listAudits(tab)
      .then(items => { if (active) setAudits(items); })
      .catch(e => { if (active) { setAudits([]); setError(e.message); } });

    return () => { active = false; };
  }, [tab]);

  const columns = COLUMNS[tab];

  const options = useMemo(() => Object.fromEntries(columns.map(([key]) => [
    key,
    [...new Set((audits ?? []).map(a => a[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true })),
  ])), [audits, columns]);

  const activeFilters = Object.entries(filters).filter(([, v]) => v);
  const filtered  = (audits ?? []).filter(a => activeFilters.every(([key, v]) => a[key] === v));

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(0);
  }
  const pageCount = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current   = Math.min(page, pageCount - 1);
  const start     = pageSize ? current * pageSize : 0;
  const rows      = pageSize ? filtered.slice(start, start + pageSize) : filtered;

  return (
    <PageContainer size="xl">
      <h1 className="text-2xl font-semibold text-text">Registro de evaluaciones</h1>
      <p className="mt-1 text-sm text-text-muted">Todas las evaluaciones realizadas, de la más reciente a la más antigua.</p>

      <div role="tablist" className={`mt-6 ${SEGMENTED}`}>
        {QUESTIONNAIRE_OPTIONS.map(({ key, title, Icon }) => {
          const selected = key === tab;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={selected}
              onClick={() => setSearchParams({ tab: key }, { replace: true })}
              className={`flex items-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-all ${
                selected ? TYPE_THEMES[key].tab : 'text-text-muted hover:bg-white/60'
              }`}
            >
              <Icon size={16} /> {title}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-4">
        {audits === null && <StatusMessage loading />}
        {error && <StatusMessage error={error} />}
        {audits?.length === 0 && !error && (
          <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>
            Aún no hay evaluaciones de este tipo.
          </p>
        )}
        {audits?.length > 0 && (
          <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                {columns.map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1 text-xs font-medium text-text-muted">
                    {label}
                    <Select block={false} value={filters[key] ?? ''} onChange={e => setFilter(key, e.target.value)} className="min-w-36">
                      <option value="">Todos</option>
                      {options[key].map(v => <option key={v} value={v}>{v}</option>)}
                    </Select>
                  </label>
                ))}
                {activeFilters.length > 0 && (
                  <Button variant="warning" onClick={() => { setFilters({}); setPage(0); }}>
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
                Filas
                <Select block={false} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n || 'Todas'}</option>)}
                </Select>
              </label>
            </div>

            {rows.length > 0
              ? <AuditTable questionnaireKey={tab} audits={rows} />
              : <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>No hay evaluaciones con estos filtros.</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
              <p>
                {filtered.length === 0
                  ? '0 evaluaciones'
                  : `Mostrando ${start + 1}–${start + rows.length} de ${filtered.length}`}
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setPage(current - 1)} disabled={current === 0}>
                    <ChevronLeft size={16} /> Anterior
                  </Button>
                  <span className="px-1">{current + 1} / {pageCount}</span>
                  <Button onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1}>
                    Siguiente <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
