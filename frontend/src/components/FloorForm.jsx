import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import PageContainer from './layout/PageContainer.jsx';
import StatusMessage from './StatusMessage.jsx';
import CatalogSelect from './CatalogSelect.jsx';

const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export default function FloorForm({ option, catalog, onSubmit, submitting, error }) {
  const [centroCoste, setCentroCoste] = useState('');
  const [area, setArea]               = useState('');
  const [supervisor, setSupervisor]   = useState('');
  const [personaEvaluada, setPersonaEvaluada] = useState('');

  const { title, Icon } = option;
  const isValid = [centroCoste, area, supervisor, personaEvaluada].every(v => v.trim() !== '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    onSubmit({
      costCenter: centroCoste.trim(),
      area: area.trim(),
      supervisor: supervisor.trim(),
      evaluatedPerson: personaEvaluada.trim(),
    });
  }

  return (
    <PageContainer>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nueva evaluación</p>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Field label="Centro de coste" htmlFor="centro_coste">
          <CatalogSelect
            id="centro_coste"
            value={centroCoste}
            onChange={setCentroCoste}
            entries={catalog?.costCenter ?? null}
            placeholder="Selecciona centro de coste"
            tab="piso"
            className={fieldClass}
          />
        </Field>

        <Field label="Área" htmlFor="area">
          <CatalogSelect
            id="area"
            value={area}
            onChange={setArea}
            entries={catalog?.area ?? null}
            placeholder="Selecciona área"
            tab="piso"
            className={fieldClass}
          />
        </Field>

        <Field label="Supervisor" htmlFor="supervisor">
          <CatalogSelect
            id="supervisor"
            value={supervisor}
            onChange={setSupervisor}
            entries={catalog?.supervisor ?? null}
            placeholder="Selecciona supervisor"
            tab="piso"
            className={fieldClass}
          />
        </Field>

        <Field label="Persona evaluada" htmlFor="persona_evaluada">
          <CatalogSelect
            id="persona_evaluada"
            value={personaEvaluada}
            onChange={setPersonaEvaluada}
            entries={catalog?.evaluatedPerson ?? null}
            placeholder="Selecciona persona evaluada"
            tab="piso"
            className={fieldClass}
          />
        </Field>

        {error && <StatusMessage error={error} />}

        <button type="submit" disabled={!isValid || submitting} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {submitting ? 'Iniciando…' : 'Iniciar auditoría'}
        </button>
      </form>
    </PageContainer>
  );
}
