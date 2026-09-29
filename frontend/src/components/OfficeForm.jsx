import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import PageContainer from './layout/PageContainer.jsx';
import StatusMessage from './StatusMessage.jsx';

const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30';

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export default function OfficeForm({ option, onSubmit, submitting, error }) {
  const [departamento, setDepartamento] = useState('');
  const [persona, setPersona]           = useState('');
  const [taller, setTaller]             = useState('');
  const [supervisor, setSupervisor]             = useState('');
  const [creador, setCreador]           = useState('');

  const { title, Icon } = option;
  const isValid = [departamento, persona, taller, creador].every(v => v.trim() !== '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    onSubmit({
      department: departamento.trim(),
      contactPerson: persona.trim(),
      workshop: taller.trim(),
      supervisor: supervisor.trim(),
      creator: creador.trim(),
    });
  }

  return (
    <PageContainer>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nueva evaluación</p>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Field label="Área/Departamento" htmlFor="departamento">
          <input
            id="departamento"
            value={departamento}
            onChange={e => setDepartamento(e.target.value)}
            maxLength={100}
            placeholder="Área/Departamento"
            className={fieldClass}
          />
        </Field>

        <Field label="Persona de contacto" htmlFor="persona">
          <input
            id="persona"
            value={persona}
            onChange={e => setPersona(e.target.value)}
            maxLength={100}
            placeholder="Persona de contacto"
            className={fieldClass}
          />
        </Field>

        <Field label="Taller" htmlFor="taller">
          <input
            id="taller"
            value={taller}
            onChange={e => setTaller(e.target.value)}
            maxLength={100}
            placeholder="Taller"
            className={fieldClass}
          />
        </Field>

        <Field label="Supervisor" htmlFor="supervisor">
          <input
            id="supervisor"
            value={creador}
            onChange={e => setSupervisor(e.target.value)}
            maxLength={100}
            placeholder="Nombre del supervisor"
            className={fieldClass}
          />
        </Field>

        <Field label="Creador" htmlFor="creador">
          <input
            id="creador"
            value={creador}
            onChange={e => setCreador(e.target.value)}
            maxLength={100}
            placeholder="Nombre del creador"
            className={fieldClass}
          />
        </Field>

        {error && <StatusMessage error={error} />}

        <button type="submit" disabled={!isValid || submitting} className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
          {submitting ? 'Iniciando…' : 'Iniciar auditoría'}
        </button>
      </form>
    </PageContainer>
  );
}
