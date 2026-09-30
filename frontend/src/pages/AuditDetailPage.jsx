import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, ChevronRight, X } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import SectionDivider from '../components/chat/SectionDivider.jsx';
import { useAudit } from '../hooks/useAudit.js';
import { PANEL, TILE } from '../constants/styles.js';
import Button from '../components/Button.jsx';
import { getQuestionnaireOption, HEADER_FIELDS } from '../constants/questionnaires.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' });

const toGrade = (score, max) => (max ? Math.round((score / max) * 100) : 0);

function AnswerBadge({ answer }) {
  return answer ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success ring-1 ring-success/25">
      <Check size={14} /> Sí
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger ring-1 ring-danger/25">
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
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} /> Registro de evaluaciones
      </Link>

      {/* Summary */}
      <section className={`mt-4 p-6 ${PANEL}`}>
        <p className="text-xs font-medium   text-text-muted">{option?.title ?? state.questionnaireKey}</p>
        <h1 className="text-xl font-semibold text-text">{state.title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {dateFormat.format(new Date(state.completedAt ?? state.createdAt))}
        </p>

        {done ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className={`p-4 text-center ${TILE}`}>
              <p className="text-xs font-medium   text-text-muted">Calificación</p>
              <p className="mt-1 text-4xl font-semibold text-text">
                {toGrade(state.score, state.total)}<span className="text-lg font-medium text-text-faint"> / 100</span>
              </p>
            </div>
            <div className={`p-4 text-center ${TILE}`}>
              <p className="text-xs font-medium   text-text-muted">Puntos</p>
              <p className="mt-1 text-4xl font-semibold text-text">
                {state.score}<span className="text-lg font-medium text-text-faint"> / {state.total}</span>
              </p>
            </div>
            <div className={`flex flex-col justify-center p-4 text-center ${TILE}`}>
              <p className="text-xs font-medium   text-text-muted">Resultado</p>
              <p className="mt-1 text-lg font-semibold text-text">{state.result ?? '—'}</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 glass rounded-control border border-accent/30 bg-accent/10 p-4 text-sm text-accent">
            <p>
              Evaluación en curso: {state.history.length} de {state.total} preguntas respondidas
              ({yesCount} {yesCount === 1 ? 'punto' : 'puntos'} hasta ahora). La calificación se calcula al terminar.
            </p>
            <Button as={Link} to={`/audits/${auditId}`} variant="success">
              Continuar <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {details.length > 0 && (
          <dl className="mt-6 grid gap-x-6 gap-y-2 border-t border-white/60 pt-4 text-sm sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-text-muted">{label}</dt>
                <dd className="text-right font-medium text-text">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Points per section */}
      {done && state.sectionScores?.length > 0 && (
        <section className={`mt-4 p-6 ${PANEL}`}>
          <h2 className="font-semibold text-text">Puntos por sección</h2>
          <ul className="mt-4 space-y-3">
            {state.sectionScores.map(s => {
              const grade = toGrade(s.score, s.max);
              return (
                <li key={s.section}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-text-muted">{sectionNames.get(s.section) ?? s.section}</span>
                    <span className="whitespace-nowrap font-medium text-text">
                      {s.score} / {s.max} <span className="text-text-faint">· {grade}</span>
                    </span>
                  </div>
                  <div className="neu-inset mt-1 h-2 overflow-hidden rounded-full bg-white/50">
                    <div className="h-full rounded-full bg-gradient-to-br from-accent to-[#409CFF]" style={{ width: `${grade}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Questions and answers */}
      <section className={`mt-4 p-6 ${PANEL}`}>
        <h2 className="font-semibold text-text">Preguntas y respuestas</h2>

        {state.history.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">Aún no hay respuestas.</p>
        ) : (
          <ol className="mt-2">
            {state.history.map((h, i) => {
              const divider = h.section.key !== lastSection && <SectionDivider name={h.section.name} />;
              lastSection = h.section.key;
              return (
                <li key={i}>
                  {divider}
                  <div className="flex items-start justify-between gap-3 border-b border-white/60 py-3 ">
                    <div className="min-w-0 text-sm">
                      <p className="text-text">
                        <span className="mr-1.5 font-medium text-text-faint">{i + 1}.</span>
                        {h.question}
                      </p>
                      {!h.answer && h.deviation && (
                        <p className="mt-2 rounded-control border border-danger/25 bg-danger/10 px-3 py-2 text-danger">
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
