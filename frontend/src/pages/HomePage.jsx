import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { listQuestionnaires } from '../api/questionnaires.js';
import { QUESTIONNAIRE_OPTIONS } from '../constants/questionnaires.js';

const FIVE_S = ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'];

// Full class names so Tailwind can detect them
const CARD_THEMES = {
  piso:    { icon: 'bg-emerald-50 text-emerald-600', label: 'text-emerald-700' },
  oficina: { icon: 'bg-amber-50 text-amber-600',     label: 'text-amber-700' },
};

function OptionCard({ option, status }) {
  const { key, title, description, Icon } = option;
  const enabled = status === 'available';
  const theme = CARD_THEMES[key] ?? CARD_THEMES.piso;

  const label = {
    loading: 'Cargando…',
    available: 'Iniciar evaluación',
    unavailable: 'Próximamente',
  }[status];

  return (
    <>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          enabled ? theme.icon : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icon size={24} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-slate-600">{description}</p>
      <span
        className={`mt-6 flex items-center gap-1 text-sm font-semibold ${
          enabled ? theme.label : 'text-slate-400'
        }`}
      >
        {label}
        {enabled && <ChevronRight size={16} className="transition group-hover:translate-x-1" />}
      </span>
    </>
  );
}

export default function HomePage() {
  const [availableKeys, setAvailableKeys] = useState(null);   // null = still loading
  const [error, setError] = useState(null);

  useEffect(() => {
    listQuestionnaires()
      .then(items => setAvailableKeys(new Set(items.map(q => q.key))))
      .catch(e => setError(e.message));
  }, []);

  function statusOf(key) {
    if (availableKeys === null) return error ? 'unavailable' : 'loading';
    return availableKeys.has(key) ? 'available' : 'unavailable';
  }

  const cardBase = 'group flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200';

  return (
    <PageContainer size="lg">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-7xl">
          Evaluación 5S
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Selecciona el tipo de área a auditar. Responderás preguntas de Sí o No
          organizadas por cada una de las 5S.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {FIVE_S.map(s => (
            <li key={s} className="rounded-full bg-white px-5 py-2 text-base font-medium text-slate-600 ring-1 ring-slate-200">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {error && <div className="mt-8"><StatusMessage error={error} /></div>}

      {availableKeys?.size === 0 && (
        <div role="status" className="mt-8 rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-800 ring-1 ring-amber-200">
          No hay cuestionarios cargados.
        </div>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {QUESTIONNAIRE_OPTIONS.map(option => {
          const status = statusOf(option.key);

          return status === 'available' ? (
            <Link
              key={option.key}
              to={`/audits/new/${option.key}`}
              className={`${cardBase} shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-cyan-500`}
            >
              <OptionCard option={option} status={status} />
            </Link>
          ) : (
            <div key={option.key} aria-disabled="true" className={`${cardBase} cursor-not-allowed opacity-70`}>
              <OptionCard option={option} status={status} />
            </div>
          );
        })}
      </section>
    </PageContainer>
  );
}