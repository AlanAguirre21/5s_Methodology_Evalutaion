import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, FileSpreadsheet } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { listQuestionnaires } from '../api/questionnaires.js';
import { QUESTIONNAIRE_OPTIONS } from '../constants/questionnaires.js';
import { CHIP, PANEL, ACCENT_THEME } from '../constants/styles.js';

const FIVE_S = ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'];

const POWER_BI_OPTION = {
  key: 'powerbi',
  title: 'Exportar a Power BI',
  description: 'Descarga los resultados de las auditorías para analizarlos por área, por S y a lo largo del tiempo en tus tableros de Power BI.',
  Icon: FileSpreadsheet,
  actionLabel: 'Exportar datos',
};
const POWER_BI_STATUS = 'unavailable';   // switch to 'available' once the export exists

function OptionCard({ option, status }) {
  const { title, description, Icon, actionLabel = 'Iniciar evaluación' } = option;
  const enabled = status === 'available';
  const theme = ACCENT_THEME;

  const label = {
    loading: 'Cargando…',
    available: actionLabel,
    unavailable: 'Próximamente',
  }[status];

  return (
    <>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-control ${
          enabled ? theme.icon : 'bg-white/50 text-text-faint'
        }`}
      >
        <Icon size={24} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-text">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-text-muted">{description}</p>
      <span
        className={`mt-6 flex items-center gap-1 text-sm font-semibold ${
          enabled ? theme.label : 'text-text-faint'
        }`}
      >
        {label}
        {enabled && <ChevronRight size={16} />}
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

  const cardBase = `group flex flex-col p-6 ${PANEL}`;

  return (
    <PageContainer size="lg">
      <section className="text-center">
        <hgroup className="flex flex-col items-center gap-0 sm:gap-0">
        <p className="text-sm font-semibold leading-none text-zf-blue sm:text-lg">
          ZF ESL
        </p>
        <h1 className="flex items-center gap-3 text-4xl font-semibold text-text sm:gap-5 sm:text-7xl">
          <img src="/ZF_logo.svg" alt="" className="size-[1em] object-contain" />
          Evaluación 5S
        </h1>
      </hgroup>

        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          Selecciona el tipo de área a auditar. Responderás preguntas de Sí o No
          organizadas por cada una de las 5S.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {FIVE_S.map(s => (
            <li key={s} className={`px-5 py-2 text-base font-medium text-text-muted ${CHIP}`}>
              {s}
            </li>
          ))}
        </ul>
      </section>

      {error && <div className="mt-8"><StatusMessage error={error} /></div>}

      {availableKeys?.size === 0 && (
        <div role="status" className="glass mt-8 rounded-control border border-warning/25 bg-warning/25 p-4 text-center text-sm text-text">
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
              className={`${cardBase} transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30`}
            >
              <OptionCard option={option} status={status} />
            </Link>
          ) : (
            <div key={option.key} aria-disabled="true" className={`${cardBase} cursor-not-allowed opacity-40`}>
              <OptionCard option={option} status={status} />
            </div>
          );
        })}

        {/* Power BI export: same card as the questionnaires, full width */}
        {POWER_BI_STATUS === 'available' ? (
          <button
            type="button"
            className={`${cardBase} text-left transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30 sm:col-span-2`}
          >
            <OptionCard option={POWER_BI_OPTION} status={POWER_BI_STATUS} />
          </button>
        ) : (
          <div aria-disabled="true" className={`${cardBase} cursor-not-allowed opacity-40 sm:col-span-2`}>
            <OptionCard option={POWER_BI_OPTION} status={POWER_BI_STATUS} />
          </div>
        )}
      </section>
    </PageContainer>
  );
}
