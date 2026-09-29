import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { listAudits } from '../api/audits.js';
import { QUESTIONNAIRE_OPTIONS } from '../constants/questionnaires.js';

// Header columns per questionnaire type (they match FloorForm / OfficeForm)
const COLUMNS = {
  piso: [
    ['costCenter', 'Centro de coste'],
    ['area', 'Área'],
    ['supervisor', 'Supervisor'],
    ['creator', 'Creador'],
  ],
  oficina: [
    ['department', 'Área/Departamento'],
    ['contactPerson', 'Persona de contacto'],
    ['workshop', 'Taller'],
    ['creator', 'Creador'],
  ],
};

// Full class names so Tailwind can detect them
const TAB_THEMES = {
  piso:    { active: 'bg-emerald-600 text-white shadow-sm', score: 'text-emerald-700' },
  oficina: { active: 'bg-amber-500 text-white shadow-sm',   score: 'text-amber-700' },
};

const PAGE_SIZES = [10, 25, 50, 100, 0];   // 0 = all rows

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

function StatusBadge({ audit }) {
  if (audit.status === 'completed') {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{audit.result ?? 'Completada'}</span>;
  }
  return (
    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
      En curso · {audit.answered}/{audit.total}
    </span>
  );
}

function AuditTable({ questionnaireKey, audits }) {
  const columns = COLUMNS[questionnaireKey];
  const theme = TAB_THEMES[questionnaireKey];

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            {columns.map(([key, label]) => <th key={key} className="px-4 py-3 font-medium">{label}</th>)}
            <th className="px-4 py-3 text-right font-medium">Puntaje</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3"><span className="sr-only">Abrir</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {audits.map(a => {
            const done = a.status === 'completed';
            const to = done ? `/audits/${a.auditId}/result` : `/audits/${a.auditId}`;
            return (
              <tr key={a.auditId} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateFormat.format(new Date(a.completedAt ?? a.createdAt))}</td>
                {columns.map(([key]) => <td key={key} className="px-4 py-3 text-slate-800">{a[key] || '—'}</td>)}
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${done ? theme.score : 'text-slate-400'}`}>
                  {done ? `${a.score} / ${a.total}` : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge audit={a} /></td>
                <td className="px-4 py-3 text-right">
                  <Link to={to} className="inline-flex items-center gap-0.5 whitespace-nowrap font-medium text-slate-600 hover:text-slate-900">
                    {done ? 'Ver' : 'Continuar'} <ChevronRight size={16} />
                  </Link>
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

  const [audits, setAudits]     = useState(null);   // null = loading
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState({});     // { field: value }; missing/'' = all
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage]         = useState(0);

  useEffect(() => {
    let active = true;
    setAudits(null);
    setError(null);
    setFilters({});   // each tab has its own columns and values
    setPage(0);

    listAudits(tab)
      .then(items => { if (active) setAudits(items); })
      .catch(e => { if (active) { setAudits([]); setError(e.message); } });

    return () => { active = false; };
  }, [tab]);

  const columns = COLUMNS[tab];

  // Distinct values per column, sorted, for each filter's options
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
      <h1 className="text-2xl font-bold text-slate-800">Registro de evaluaciones</h1>
      <p className="mt-1 text-sm text-slate-600">Todas las evaluaciones realizadas, de la más reciente a la más antigua.</p>

      <div role="tablist" className="mt-6 inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {QUESTIONNAIRE_OPTIONS.map(({ key, title, Icon }) => {
          const selected = key === tab;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={selected}
              onClick={() => setSearchParams({ tab: key }, { replace: true })}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                selected ? TAB_THEMES[key].active : 'text-slate-600 hover:bg-slate-50'
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
          <p className="rounded-2xl bg-white py-12 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            Aún no hay evaluaciones de este tipo.
          </p>
        )}
        {audits?.length > 0 && (
          <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                {columns.map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    {label}
                    <select value={filters[key] ?? ''} onChange={e => setFilter(key, e.target.value)} className={`${selectClass} min-w-36`}>
                      <option value="">Todos</option>
                      {options[key].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                ))}
                {activeFilters.length > 0 && (
                  <button
                    onClick={() => { setFilters({}); setPage(0); }}
                    className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Filas
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }} className={selectClass}>
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n || 'Todas'}</option>)}
                </select>
              </label>
            </div>

            {rows.length > 0
              ? <AuditTable questionnaireKey={tab} audits={rows} />
              : <p className="rounded-2xl bg-white py-12 text-center text-sm text-slate-500 ring-1 ring-slate-200">No hay evaluaciones con estos filtros.</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                {filtered.length === 0
                  ? '0 evaluaciones'
                  : `Mostrando ${start + 1}–${start + rows.length} de ${filtered.length}`}
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(current - 1)}
                    disabled={current === 0}
                    className="inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 font-medium ring-1 ring-slate-200 hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span className="px-1">{current + 1} / {pageCount}</span>
                  <button
                    onClick={() => setPage(current + 1)}
                    disabled={current >= pageCount - 1}
                    className="inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 font-medium ring-1 ring-slate-200 hover:bg-white disabled:opacity-40"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
