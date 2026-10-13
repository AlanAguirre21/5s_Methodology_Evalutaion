import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import AuditTable from '../../components/AuditTable.jsx';
import ScoreChart from '../../components/ScoreChart.jsx';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/Input.jsx';
import { listMyAudits } from '../../api/audits.js';
import { useAuth } from '../../hooks/useAuth.js';
import { QUESTIONNAIRE_OPTIONS } from '../../constants/questionnaires.js';
import { ROLES } from '../../constants/roles.js';
import { PANEL, SEGMENTED, TILE, ACCENT_THEME } from '../../constants/styles.js';

const PERIODS = [
  { key: '1m', label: 'Último mes',      months: 1 },
  { key: '3m', label: 'Últimos 3 meses', months: 3 },
  { key: '6m', label: 'Últimos 6 meses', months: 6 },
  { key: '1y', label: 'Último año',      months: 12 },
];
const DEFAULT_PERIOD = '1y';
const CUSTOM = 'custom';
const PAGE_SIZE = 10;

const toInput = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startOfDay = value => new Date(`${value}T00:00:00`);
const endOfDay   = value => new Date(`${value}T23:59:59.999`);

function rangeOf(periodKey) {
  const { months } = PERIODS.find(p => p.key === periodKey);
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - months);
  return { from: toInput(from), to: toInput(to) };
}

const pctOf = audit => Math.round((audit.score / audit.total) * 100);

function Stat({ label, value, hint }) {
  return (
    <div className={`p-4 ${TILE}`}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-text-faint">{hint}</p>}
    </div>
  );
}

export default function ProfileRecordPage() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = QUESTIONNAIRE_OPTIONS.some(o => o.key === tabParam) ? tabParam : QUESTIONNAIRE_OPTIONS[0].key;

  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [range, setRange]   = useState(() => rangeOf(DEFAULT_PERIOD));   // { from, to } as yyyy-mm-dd
  const [audits, setAudits] = useState(null);                            // of every type, in the period
  const [error, setError]   = useState(null);
  const [page, setPage]     = useState(0);

  const rangeValid = Boolean(range.from && range.to) && range.from <= range.to;

  useEffect(() => {
    if (!rangeValid) return;
    let active = true;
    setAudits(null);
    setError(null);
    setPage(0);

    listMyAudits(startOfDay(range.from), endOfDay(range.to))
      .then(items => { if (active) setAudits(items); })
      .catch(e => { if (active) { setAudits([]); setError(e.message); } });

    return () => { active = false; };
  }, [range.from, range.to, rangeValid]);

  function choosePeriod(key) {
    setPeriod(key);
    if (key !== CUSTOM) setRange(rangeOf(key));
  }

  function chooseDate(field, value) {
    setPeriod(CUSTOM);
    setRange(r => ({ ...r, [field]: value }));
  }

  const ofTab = useMemo(() => (audits ?? []).filter(a => a.questionnaireKey === tab), [audits, tab]);
  const completed = useMemo(() => ofTab.filter(a => a.status === 'completed'), [ofTab]);
  const points = useMemo(() => completed.map(a => ({
    id: a.auditId,
    date: new Date(a.completedAt),
    pct: pctOf(a),
    score: a.score,
    total: a.total,
    result: a.result,
  })), [completed]);

  const average = points.length ? Math.round(points.reduce((sum, p) => sum + p.pct, 0) / points.length) : null;
  const best    = points.length ? Math.max(...points.map(p => p.pct)) : null;
  const pending = ofTab.length - completed.length;

  const pageCount = Math.max(1, Math.ceil(ofTab.length / PAGE_SIZE));
  const current   = Math.min(page, pageCount - 1);
  const start     = current * PAGE_SIZE;
  const rows      = ofTab.slice(start, start + PAGE_SIZE);

  return (
    <PageContainer size="xl">
      <h1 className="text-2xl font-semibold text-text">Historial de evaluaciones</h1>
      <p className="mt-1 text-sm text-text-muted">{isAdmin ? 'Las evaluaciones que realizaste en el periodo seleccionado.' : 'Los resultados de las evaluaciones que te hicieron en el periodo seleccionado.'}</p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div role="tablist" className={SEGMENTED}>
          {QUESTIONNAIRE_OPTIONS.map(({ key, title, Icon }) => {
            const selected = key === tab;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={selected}
                onClick={() => { setSearchParams({ tab: key }, { replace: true }); setPage(0); }}
                className={`flex items-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-all ${
                  selected ? ACCENT_THEME.tab : 'text-text-muted hover:bg-white/60'
                }`}
              >
                <Icon size={16} /> {title}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
            Periodo
            <Select block={false} value={period} onChange={e => choosePeriod(e.target.value)}>
              {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              <option value={CUSTOM}>Personalizado</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
            Desde
            <Input type="date" block={false} value={range.from} max={range.to} onChange={e => chooseDate('from', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
            Hasta
            <Input type="date" block={false} value={range.to} min={range.from} onChange={e => chooseDate('to', e.target.value)} />
          </label>
        </div>
      </div>

      <div role="tabpanel" className="mt-4 space-y-4">
        {!rangeValid && <StatusMessage error="Elige una fecha inicial anterior o igual a la fecha final." />}
        {rangeValid && audits === null && <StatusMessage loading />}
        {error && <StatusMessage error={error} />}

        {rangeValid && audits !== null && !error && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Evaluaciones"
                value={ofTab.length}
                hint={pending > 0 ? `${completed.length} completadas · ${pending} en curso` : null}
              />
              <Stat label="Calificación promedio" value={average ?? '—'} hint={average === null ? null : 'de 100'} />
              <Stat label="Mejor calificación" value={best ?? '—'} hint={best === null ? null : 'de 100'} />
            </div>

            <section aria-labelledby="chart-title" className={`p-5 ${PANEL}`}>
              <h2 id="chart-title" className="font-semibold text-text">Calificación por evaluación</h2>
              <p className="text-sm text-text-muted">Puntos obtenidos sobre el total, en escala de 0 a 100, por fecha de finalización.</p>
              <div className="mt-4">
                {points.length > 0
                  ? <ScoreChart points={points} from={startOfDay(range.from)} to={endOfDay(range.to)} />
                  : <p className="py-12 text-center text-sm text-text-muted">No hay evaluaciones completadas en este periodo.</p>}
              </div>
            </section>

            {ofTab.length > 0
              ? <AuditTable questionnaireKey={tab} audits={rows} users={[user]} />
              : <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>{isAdmin ? 'No realizaste evaluaciones de este tipo en el periodo.' : 'No tienes evaluaciones de este tipo en el periodo.'}</p>}

            {ofTab.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
                <p>Mostrando {start + 1}–{start + rows.length} de {ofTab.length}</p>
                {pageCount > 1 && (
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setPage(current - 1)} disabled={current === 0}>
                      <ChevronLeft size={16} /> Anterior
                    </Button>
                    <span className="px-1">{current + 1} / {pageCount}</span>
                    <Button onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1}>
                      Siguiente <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
