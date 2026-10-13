import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { listCatalog, addCatalogEntry, deleteCatalogEntry } from '../api/catalog.js';
import { QUESTIONNAIRE_OPTIONS, CATALOG_FIELDS } from '../constants/questionnaires.js';
import Button from '../components/Button.jsx';
import { Input, Select } from '../components/Input.jsx';
import { PANEL, SEGMENTED, ACCENT_THEME } from '../constants/styles.js';

const CARD_ORDER = {
  oficina: ['workshop', 'department'],
};

function cardFields(questionnaireKey) {
  const fields = CATALOG_FIELDS[questionnaireKey];
  const order = CARD_ORDER[questionnaireKey];
  if (!order) return fields;
  const rank = key => (order.includes(key) ? order.indexOf(key) : order.length);
  return [...fields].sort((a, b) => rank(a.key) - rank(b.key));
}

const PAGE_SIZES = [10, 25, 50, 100, 0];   // 0 = all rows

const normalize = str => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const byValue = (a, b) => a.value.localeCompare(b.value, 'es', { numeric: true, sensitivity: 'base' });

function FieldCard({ questionnaireKey, field, entries, onAdded, onDeleted }) {
  const [text, setText]       = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);
  const [query, setQuery]     = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage]       = useState(0);
  const [confirmId, setConfirmId] = useState(null);   
  const inputId = `${questionnaireKey}-${field.key}`;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? entries.filter(e => normalize(e.value).includes(q)) : entries;
  }, [entries, query]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current   = Math.min(page, pageCount - 1);   
  const start     = pageSize ? current * pageSize : 0;
  const rows      = pageSize ? filtered.slice(start, start + pageSize) : filtered;

  async function handleAdd(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      onAdded(field.key, await addCatalogEntry({ questionnaireKey, field: field.key, value }));
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(entry) {
    setConfirmId(null);
    setError(null);
    try {
      await deleteCatalogEntry(entry._id);
      onDeleted(field.key, entry._id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className={`flex min-w-0 flex-col p-5 ${PANEL}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-text">{field.label}</h2>
        <span className="text-xs text-text-muted">{entries.length} registrados</span>
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <label htmlFor={inputId} className="sr-only">Nuevo: {field.label}</label>
        <Input
          id={inputId}
          block={false}
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={100}
          placeholder={`Agregar ${field.label.toLowerCase()}`}
          className="min-w-0 flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!text.trim() || busy}
          aria-label={`Agregar ${field.label}`}
        >
          <Plus size={16} /> Agregar
        </Button>
      </form>

      {error && <div className="mt-2"><StatusMessage error={error} /></div>}

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-text-faint">Sin registros.</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute inset-y-0 left-2.5 my-auto text-text-faint" />
              <Input
                type="search"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(0); }}
                placeholder="Buscar"
                aria-label={`Buscar en ${field.label}`}
                className="pl-8"
              />
            </div>
            <Select
              block={false}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              aria-label="Filas por página"
              className="shrink-0"
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n || 'Todas'}</option>)}
            </Select>
          </div>

          <div className={`mt-2 overflow-x-hidden rounded-control border border-border bg-white/40 ${pageSize ? '' : 'max-h-[28rem] overflow-y-auto'}`}>
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 bg-white/80 text-xs   text-text-muted">
                <tr>
                  <th className="w-12 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{field.label}</th>
                  <th className="w-12 px-3 py-2"><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody className=" ">
                {rows.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-text-faint">Sin resultados para "{query.trim()}".</td></tr>
                ) : rows.map((entry, i) => confirmId === entry._id ? (
                  <tr key={entry._id} className="border-b border-white/40 bg-danger/10">
                    <td colSpan={3} className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 text-danger">
                          ¿Eliminar <strong>{entry.value}</strong>? Las evaluaciones anteriores no cambian.
                        </span>
                        <span className="flex shrink-0 gap-1.5">
                          <Button size="sm" onClick={() => setConfirmId(null)}>Cancelar</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(entry)}>Eliminar</Button>
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={entry._id} className="border-b border-white/40 hover:bg-white/50">
                    <td className="px-3 py-2 text-text-faint">{start + i + 1}</td>
                    <td className="truncate px-3 py-2 text-text" title={entry.value}>{entry.value}</td>
                    <td className="px-3 py-1.5 text-right">
                      <button
                        onClick={() => setConfirmId(entry._id)}
                        aria-label={`Eliminar ${entry.value}`}
                        className="rounded-control p-1 text-text-faint hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-text-muted">
            <span>
              {filtered.length === 0 ? '0' : `${start + 1}–${start + rows.length}`} de {filtered.length}
              {filtered.length !== entries.length && ` (de ${entries.length})`}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Página anterior" className="px-1.5">
                  <ChevronLeft size={14} />
                </Button>
                <span>{current + 1} / {pageCount}</span>
                <Button size="sm" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Página siguiente" className="px-1.5">
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default function PeoplePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = QUESTIONNAIRE_OPTIONS.some(o => o.key === tabParam) ? tabParam : QUESTIONNAIRE_OPTIONS[0].key;

  const [catalog, setCatalog] = useState(null);   // { field: [{ _id, value }] }, null = loading
  const [error, setError]     = useState(null);

  useEffect(() => {
    let active = true;
    setCatalog(null);
    setError(null);

    listCatalog(tab)
      .then(c => { if (active) setCatalog(c); })
      .catch(e => { if (active) setError(e.message); });

    return () => { active = false; };
  }, [tab]);

  function handleAdded(field, entry) {
    setCatalog(c => ({ ...c, [field]: [...c[field], entry].sort(byValue) }));
  }

  function handleDeleted(field, id) {
    setCatalog(c => ({ ...c, [field]: c[field].filter(e => e._id !== id) }));
  }

  return (
    <PageContainer size="xl">
      <h1 className="text-2xl font-semibold text-text">Elementos de auditoría</h1>
      <p className="mt-1 text-sm text-text-muted">
        Solo los datos registrados aquí aparecen en los formularios de evaluación.
      </p>

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
        {error && <StatusMessage error={error} />}
        {!catalog && !error && <StatusMessage loading />}
        {catalog && (
          <div className="grid items-start gap-4 md:grid-cols-2">
            {cardFields(tab).map(field => (
              <FieldCard
                key={`${tab}-${field.key}`}
                questionnaireKey={tab}
                field={field}
                entries={catalog[field.key] ?? []}
                onAdded={handleAdded}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
