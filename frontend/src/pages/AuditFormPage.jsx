import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { getQuestionnaireOption } from '../constants/questionnaires.js';
import { startAudit } from '../api/audits.js';

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

export default function AuditFormPage() {
  const { questionnaireKey } = useParams();
  const navigate = useNavigate();

  const [centroCoste, setCentroCoste] = useState('');
  const [area, setArea]               = useState('');
  const [supervisor, setSupervisor]   = useState('');
  const [creador, setCreador]         = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);

  const option = getQuestionnaireOption(questionnaireKey);

  if (!option) {
    return (
      <PageContainer>
        <StatusMessage error="Tipo de auditoría no válido." />
      </PageContainer>
    );
  }

  const { title, Icon } = option;
  const isValid = [centroCoste, area, supervisor, creador].every(v => v.trim() !== '');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const audit = await startAudit({
        questionnaireKey,
        costCenter: centroCoste.trim(),
        area: area.trim(),
        supervisor: supervisor.trim(),
        creator: creador.trim(),
      });
      navigate(`/audits/${audit.auditId}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
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
          <input
            id="centro_coste"
            value={centroCoste}
            onChange={e => setCentroCoste(e.target.value)}
            maxLength={100}
            placeholder="Centro de coste"
            className={fieldClass}
          />
        </Field>

        <Field label="Área" htmlFor="area">
          <input
            id="area"
            value={area}
            onChange={e => setArea(e.target.value)}
            maxLength={100}
            placeholder="Área"
            className={fieldClass}
          />
        </Field>

        <Field label="Supervisor" htmlFor="supervisor">
          <input
            id="supervisor"
            value={supervisor}
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

        <button type="submit" disabled={!isValid || submitting} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {submitting ? 'Iniciando…' : 'Iniciar auditoría'}
        </button>
      </form>
    </PageContainer>
  );
}
