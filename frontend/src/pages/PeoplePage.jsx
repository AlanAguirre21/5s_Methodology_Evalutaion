import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { listCatalog, addCatalogEntry, deleteCatalogEntry } from '../api/catalog.js';
import { QUESTIONNAIRE_OPTIONS, HEADER_FIELDS } from '../constants/questionnaires.js';

const TAB_THEMES = {
  piso: {
    active: 'bg-emerald-600 text-white shadow-sm',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    focus:  'focus:border-emerald-500 focus:ring-emerald-500/30',
  },
  oficina: {
    active: 'bg-amber-500 text-white shadow-sm',
    button: 'bg-amber-500 hover:bg-amber-600',
    focus:  'focus:border-amber-500 focus:ring-amber-500/30',
  },
};

// Card order on this page; types not listed keep the order of HEADER_FIELDS
const CARD_ORDER = {
  oficina: ['workshop', 'department', 'supervisor', 'evaluatedPerson'],
};

function cardFields(questionnaireKey) {
  const fields = HEADER_FIELDS[questionnaireKey];
  const order = CARD_ORDER[questionnaireKey];
  if (!order) return fields;
  const rank = key => (order.includes(key) ? order.indexOf(key) : order.length);
  return [...fields].sort((a, b) => rank(a.key) - rank(b.key));
}

const PAGE_SIZES = [10, 25, 50, 100, 0];   // 0 = all rows

// Lowercase without accents, so "jose" matches "José"
const normalize = str => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const byValue = (a, b) => a.value.localeCompare(b.value, 'es', { numeric: true, sensitivity: 'base' });

function FieldCard({ questionnaireKey, field, entries, onAdded, onDeleted }) {
  const theme = TAB_THEMES[questionnaireKey];
  const [text, setText]       = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);
  const [query, setQuery]     = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage]       = useState(0);
  const inputId = `${questionnaireKey}-${field.key}`;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? entries.filter(e => normalize(e.value).includes(q)) : entries;
  }, [entries, query]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current   = Math.min(page, pageCount - 1);   // stays valid after deletes / new search
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
    if (!window.confirm(`¿Eliminar "${entry.value}" de ${field.label}?\nLas evaluaciones anteriores no cambian.`)) return;
    setError(null);
    try {
      await deleteCatalogEntry(entry._id);
      onDeleted(field.key, entry._id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="flex min-w-0 flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-slate-800">{field.label}</h2>
        <span className="text-xs text-slate-500">{entries.length} registrados</span>
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <label htmlFor={inputId} className="sr-only">Nuevo: {field.label}</label>
        <input
          id={inputId}
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={100}
          placeholder={`Agregar ${field.label.toLowerCase()}`}
          className={`min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 ${theme.focus}`}
        />
        <button
          type="submit"
          disabled={!text.trim() || busy}
          aria-label={`Agregar ${field.label}`}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 ${theme.button}`}
        >
          <Plus size={16} /> Agregar
        </button>
      </form>

      {error && <div className="mt-2"><StatusMessage error={error} /></div>}

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Sin registros.</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(0); }}
                placeholder="Buscar"
                aria-label={`Buscar en ${field.label}`}
                className={`w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 ${theme.focus}`}
              />
            </div>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              aria-label="Filas por página"
              className={`shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 ${theme.focus}`}
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n || 'Todas'}</option>)}
            </select>
          </div>

          <div className={`mt-2 overflow-x-hidden rounded-lg ring-1 ring-slate-100 ${pageSize ? '' : 'max-h-[28rem] overflow-y-auto'}`}>
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-12 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{field.label}</th>
                  <th className="w-12 px-3 py-2"><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Sin resultados para "{query.trim()}".</td></tr>
                ) : rows.map((entry, i) => (
                  <tr key={entry._id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-400">{start + i + 1}</td>
                    <td className="truncate px-3 py-2 text-slate-800" title={entry.value}>{entry.value}</td>
                    <td className="px-3 py-1.5 text-right">
                      <button
                        onClick={() => handleDelete(entry)}
                        aria-label={`Eliminar ${entry.value}`}
                        className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {filtered.length === 0 ? '0' : `${start + 1}–${start + rows.length}`} de {filtered.length}
              {filtered.length !== entries.length && ` (de ${entries.length})`}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(current - 1)}
                  disabled={current === 0}
                  aria-label="Página anterior"
                  className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>{current + 1} / {pageCount}</span>
                <button
                  onClick={() => setPage(current + 1)}
                  disabled={current >= pageCount - 1}
                  aria-label="Página siguiente"
                  className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
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
      <h1 className="text-2xl font-bold text-slate-800">Registro de personas</h1>
      <p className="mt-1 text-sm text-slate-600">
        Solo los datos registrados aquí aparecen en los formularios de evaluación.
      </p>

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
