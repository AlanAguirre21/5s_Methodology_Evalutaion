import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Search } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import AuditTable from '../components/AuditTable.jsx';
import { getExportKey, listAudits } from '../api/audits.js';
import { listUsers } from '../api/users.js';
import { QUESTIONNAIRE_OPTIONS, AUDIT_COLUMNS, getQuestionnaireOption } from '../constants/questionnaires.js';
import { PANEL, SEGMENTED, ACCENT_THEME } from '../constants/styles.js';
import Button from '../components/Button.jsx';
import { Input, Select } from '../components/Input.jsx';

const PAGE_SIZES = [10, 25, 50, 100, 0];  

const normalize = str => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export default function RecordPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = QUESTIONNAIRE_OPTIONS.some(o => o.key === tabParam) ? tabParam : QUESTIONNAIRE_OPTIONS[0].key;

  const [audits, setAudits]     = useState(null);  
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState({});     
  const [query, setQuery]       = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage]         = useState(0);
  const [exportKey, setExportKey]     = useState(null);
  const [exportError, setExportError] = useState(null);
  const [copied, setCopied]           = useState(false);
  const [users, setUsers]             = useState([]);

  useEffect(() => {
    let active = true;
    listUsers()
      .then(items => { if (active) setUsers(items); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getExportKey()
      .then(({ key }) => { if (active) setExportKey(key); })
      .catch(e => { if (active) setExportError(e.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setAudits(null);
    setError(null);
    setFilters({});  
    setQuery('');
    setCopied(false);
    setPage(0);

    listAudits(tab)
      .then(items => { if (active) setAudits(items); })
      .catch(e => { if (active) { setAudits([]); setError(e.message); } });

    return () => { active = false; };
  }, [tab]);

  const columns = AUDIT_COLUMNS[tab];

  // The evaluated person is chosen among the users (by id, so a renamed user keeps their audits); the rest, among the values in use
  const options = useMemo(() => Object.fromEntries(columns.map(([key]) => [
    key,
    key === 'evaluatedPerson'
      ? users.map(u => ({ value: u.id, label: u.name }))
      : [...new Set((audits ?? []).map(a => a[key]).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
          .map(v => ({ value: v, label: v })),
  ])), [audits, columns, users]);

  const searchable = useMemo(() => new Map((audits ?? []).map(a => [
    a.auditId,
    normalize([...columns.map(([key]) => a[key]), a.result].filter(Boolean).join(' ')),
  ])), [audits, columns]);

  const terms = normalize(query).split(/\s+/).filter(Boolean);  
  const activeFilters = Object.entries(filters).filter(([, v]) => v);
  const filtered  = (audits ?? []).filter(a =>
    activeFilters.every(([key, v]) => (key === 'evaluatedPerson' ? a.auditor === v : a[key] === v)) &&
    terms.every(t => searchable.get(a.auditId).includes(t))
  );

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(0);
  }
  const pageCount = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current   = Math.min(page, pageCount - 1);
  const start     = pageSize ? current * pageSize : 0;
  const rows      = pageSize ? filtered.slice(start, start + pageSize) : filtered;

  const exportUrl = exportKey
    ? `${window.location.origin}/api/export/${exportKey}/${tab}.csv`
    : null;

  async function handleCopy(e) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
    } catch {
      setExportError('No se pudo copiar. Copia el enlace con el botón derecho.');
    }
  }

  return (
    <PageContainer size="xl">
      <h1 className="text-2xl font-semibold text-text">Registro de evaluaciones</h1>
      <p className="mt-1 text-sm text-text-muted">Todas las evaluaciones realizadas, de la más reciente a la más antigua.</p>

      <section aria-label="Power BI" className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm ${PANEL}`}>
        <FileSpreadsheet size={18} className="shrink-0 text-accent" />
        <span className="font-medium text-text">Power BI</span>
        {exportUrl && (
          <a href={exportUrl} onClick={handleCopy} className="font-medium text-accent hover:underline">
            Copiar enlace de {getQuestionnaireOption(tab).title} para Power BI
          </a>
        )}
        {copied && <span role="status" className="text-text-muted">Copiado. En Power BI Desktop: Obtener datos → Web y pega el enlace.</span>}
        {exportError && <span role="alert" className="w-full text-danger">{exportError}</span>}
      </section>

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
                selected ? ACCENT_THEME.tab : 'text-text-muted hover:bg-white/60'
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
            <div className="relative mb-3">
              <Search size={16} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-faint" />
              <Input
                type="search"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(0); }}
                placeholder={`Buscar por ${columns.map(([, label]) => label.toLowerCase()).join(', ')} o resultado`}
                aria-label="Buscar evaluaciones"
                className="py-2 pl-9"
              />
            </div>

            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                {columns.map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1 text-xs font-medium text-text-muted">
                    {label}
                    <Select block={false} value={filters[key] ?? ''} onChange={e => setFilter(key, e.target.value)} className="min-w-36">
                      <option value="">Todos</option>
                      {options[key].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </label>
                ))}
                {(activeFilters.length > 0 || terms.length > 0) && (
                  <Button variant="warning" onClick={() => { setFilters({}); setQuery(''); setPage(0); }}>
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
              ? <AuditTable questionnaireKey={tab} audits={rows} users={users} />
              : <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>No hay evaluaciones que coincidan con la búsqueda y los filtros.</p>}

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
