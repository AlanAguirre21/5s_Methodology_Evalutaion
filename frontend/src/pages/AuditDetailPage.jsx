import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, ChevronRight, X } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import SectionDivider from '../components/chat/SectionDivider.jsx';
import { useAudit } from '../hooks/useAudit.js';
import { getQuestionnaireOption, HEADER_FIELDS } from '../constants/questionnaires.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' });

// Grade on a 0–100 scale from points obtained / points possible
const toGrade = (score, max) => (max ? Math.round((score / max) * 100) : 0);

function AnswerBadge({ answer }) {
  return answer ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
      <Check size={14} /> Sí
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
      <X size={14} /> No
    </span>
  );
}

export default function AuditDetailPage() {
  const { auditId } = useParams();
  const { state, loading, error } = useAudit(auditId);

  if (loading || !state) {
    return (
      <PageContainer size="lg">
        <StatusMessage loading={loading} error={error} />
      </PageContainer>
    );
  }

  const done = state.status === 'completed';
  const option = getQuestionnaireOption(state.questionnaireKey);
  const details = (HEADER_FIELDS[state.questionnaireKey] ?? [])
    .map(f => [f.label, state[f.key]])
    .filter(([, value]) => value);

  const sectionNames = new Map(state.history.map(h => [h.section.key, h.section.name]));
  const yesCount = state.history.filter(h => h.answer).length;

  let lastSection = null;

  return (
    <PageContainer size="lg">
      <Link
        to={`/registro?tab=${state.questionnaireKey}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Registro de evaluaciones
      </Link>

      {/* Summary */}
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{option?.title ?? state.questionnaireKey}</p>
        <h1 className="text-xl font-bold text-slate-800">{state.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {dateFormat.format(new Date(state.completedAt ?? state.createdAt))}
        </p>

        {done ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Calificación</p>
              <p className="mt-1 text-4xl font-bold text-slate-800">
                {toGrade(state.score, state.total)}<span className="text-lg font-medium text-slate-400"> / 100</span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Puntos</p>
              <p className="mt-1 text-4xl font-bold text-slate-800">
                {state.score}<span className="text-lg font-medium text-slate-400"> / {state.total}</span>
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Resultado</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{state.result ?? '—'}</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 p-4 text-sm text-sky-800 ring-1 ring-sky-200">
            <p>
              Evaluación en curso: {state.history.length} de {state.total} preguntas respondidas
              ({yesCount} {yesCount === 1 ? 'punto' : 'puntos'} hasta ahora). La calificación se calcula al terminar.
            </p>
            <Link to={`/audits/${auditId}`} className="inline-flex items-center gap-0.5 font-semibold hover:underline">
              Continuar <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {details.length > 0 && (
          <dl className="mt-6 grid gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Points per section */}
      {done && state.sectionScores?.length > 0 && (
        <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-slate-800">Puntos por sección</h2>
          <ul className="mt-4 space-y-3">
            {state.sectionScores.map(s => {
              const grade = toGrade(s.score, s.max);
              return (
                <li key={s.section}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-700">{sectionNames.get(s.section) ?? s.section}</span>
                    <span className="whitespace-nowrap font-medium text-slate-800">
                      {s.score} / {s.max} <span className="text-slate-400">· {grade}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${grade}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Questions and answers */}
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-800">Preguntas y respuestas</h2>

        {state.history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aún no hay respuestas.</p>
        ) : (
          <ol className="mt-2">
            {state.history.map((h, i) => {
              const divider = h.section.key !== lastSection && <SectionDivider name={h.section.name} />;
              lastSection = h.section.key;
              return (
                <li key={i}>
                  {divider}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                    <div className="min-w-0 text-sm">
                      <p className="text-slate-800">
                        <span className="mr-1.5 font-medium text-slate-400">{i + 1}.</span>
                        {h.question}
                      </p>
                      {!h.answer && h.deviation && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-red-800">
                          <span className="font-semibold">Desviación:</span> {h.deviation}
                        </p>
                      )}
                    </div>
                    <AnswerBadge answer={h.answer} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </PageContainer>
  );
}
