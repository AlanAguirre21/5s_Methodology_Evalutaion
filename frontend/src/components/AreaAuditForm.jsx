import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, CheckCircle2, Mail, Plus, Search, UserRound, X } from 'lucide-react';
import PageContainer from './layout/PageContainer.jsx';
import StatusMessage from './StatusMessage.jsx';
import SupervisingPerson from './SupervisingPerson.jsx';
import AreaModal from './ui/AreaModal.jsx';
import Button from './Button.jsx';
import { Input } from './Input.jsx';
import { PANEL, ACCENT_THEME } from '../constants/styles.js';
import { createArea } from '../api/areas.js';

const normalize = str => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const matches = (area, q) =>
  [area.name, area.costCenter, area.manager?.name, area.manager?.email].some(v => v && normalize(v).includes(q));

function AreaOption({ area, selected, onSelect }) {
  const disabled = !area.manager;
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-control border p-3 transition-all
        has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40
        ${selected ? 'border-accent/50 bg-accent-soft shadow-md shadow-accent/10' : 'border-white/60 bg-white/50 hover:bg-white/80'}
        ${disabled ? 'cursor-not-allowed opacity-60 hover:bg-white/50' : ''}`}
    >
      <input
        type="radio"
        name="area"
        value={area.id}
        checked={selected}
        onChange={() => onSelect(area.id)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className={`font-medium ${selected ? 'text-accent' : 'text-text'}`}>{area.name}</span>
          <span className={`text-xs ${area.costCenter ? 'text-text-muted' : 'text-text-faint'}`}>
            {area.costCenter ? `CC ${area.costCenter}` : 'Sin centro de coste'}
          </span>
        </span>
        {area.manager ? (
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-muted">
            <span className="flex items-center gap-1"><UserRound size={12} className="shrink-0" /> {area.manager.name}</span>
            <span className="flex min-w-0 items-center gap-1 truncate"><Mail size={12} className="shrink-0" /> {area.manager.email}</span>
          </span>
        ) : (
          <span className="mt-1 block text-xs text-danger">Sin responsable. Agrégalo en Áreas para poder evaluarla.</span>
        )}
      </span>
      <CheckCircle2 size={18} aria-hidden="true" className={`mt-0.5 shrink-0 text-accent transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} />
    </label>
  );
}

function AddAreaLink({ query, onAddNew, prominent }) {
  return (
    <p className={`text-sm ${prominent ? 'text-text-muted' : 'text-text-faint'}`}>
      ¿No está el área que buscas?{' '}
      <button type="button" onClick={() => onAddNew(query.trim())} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
        <Plus size={14} /> {query.trim() ? `Agregar "${query.trim()}" como nueva área` : 'Agregar nueva área'}
      </button>
    </p>
  );
}

function AreaPicker({ areas, value, onChange, onAddNew }) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return q ? areas.filter(a => a.id === value || matches(a, q)) : areas;
  }, [areas, query, value]);

  if (areas.length === 0) {
    return (
      <div className="rounded-control border border-white/60 bg-white/50 p-4 text-sm text-text-muted">
        <p>No hay áreas activas.</p>
        <div className="mt-1"><AddAreaLink query="" onAddNew={onAddNew} prominent /></div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-faint" />
        <Input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por área, centro de coste o responsable"
          aria-label="Buscar área"
          aria-controls="area-options"
          className="py-2 pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute inset-y-0 right-2 my-auto h-6 w-6 rounded-full p-1 text-text-faint hover:bg-black/5 hover:text-text"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-text-faint" aria-live="polite">
        {query.trim() ? `${visible.length} de ${areas.length} áreas` : `${areas.length} áreas activas`}
      </p>

      <div id="area-options" className="mt-1.5 max-h-80 space-y-2 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-faint">Sin resultados para "{query.trim()}".</p>
        ) : visible.map(a => (
          <AreaOption key={a.id} area={a} selected={a.id === value} onSelect={onChange} />
        ))}
      </div>

      <div className="mt-2">
        <AddAreaLink query={query} onAddNew={onAddNew} prominent={visible.length === 0} />
      </div>
    </div>
  );
}

// Start form for every evaluation type: only the area is chosen; its manager is the person evaluated
export default function AreaAuditForm({ option, areas, onSubmit, submitting, error, onAreaCreated }) {
  const [areaId, setAreaId] = useState('');
  const [creating, setCreating] = useState(false);   // false | { area: null, name }

  async function saveNewArea(data) {
    const { managerAccount: _, ...created } = await createArea(data);
    onAreaCreated(created);
    setAreaId(created.id);
    setCreating(false);
  }

  const { title, Icon } = option;
  const area = areas?.find(a => a.id === areaId) ?? null;
  const isValid = Boolean(area?.manager);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    onSubmit({ areaId });
  }

  return (
    <PageContainer>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className={`neu-raised flex h-10 w-10 items-center justify-center rounded-control ${ACCENT_THEME.icon}`}>
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-medium text-text-muted">Nueva evaluación</p>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`mt-6 space-y-5 p-6 ${PANEL}`}>
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-text-muted">Área a evaluar</legend>
          {areas
            ? <AreaPicker areas={areas} value={areaId} onChange={setAreaId} onAddNew={name => setCreating({ area: null, name })} />
            : <StatusMessage loading />}
        </fieldset>

        <SupervisingPerson />

        {error && <StatusMessage error={error} />}

        <Button type="submit" size="lg" variant={ACCENT_THEME.button} disabled={!isValid || submitting}>
          {submitting ? 'Iniciando…' : area ? `Iniciar auditoría · ${area.name}` : 'Selecciona un área'}
        </Button>
      </form>

      <AreaModal open={creating} onSave={saveNewArea} onClose={() => setCreating(false)} />
    </PageContainer>
  );
}
