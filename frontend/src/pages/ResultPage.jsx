import { Link, Navigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAudit } from '../hooks/useAudit.js';

export default function ResultPage() {
  const { auditId } = useParams();
  const { state, loading, error } = useAudit(auditId);

  if (loading || !state) {
    return (
      <PageContainer>
        <StatusMessage loading={loading} error={error} />
      </PageContainer>
    );
  }

  if (state.status !== 'completed') {
    return <Navigate to={`/audits/${auditId}`} replace />;
  }

    // Each questionnaire type fills a different set of these; show only the ones present
    const details = [
        ['Centro de coste', state.costCenter],
        ['Área', state.area],
        ['Supervisor', state.supervisor],
        ['Área/Departamento', state.department],
        ['Persona de contacto', state.contactPerson],
        ['Taller', state.workshop],
        ['Creador', state.creator],
    ].filter(([, value]) => value);

  return (
    <PageContainer>
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-center text-sm font-medium text-slate-500">{state.title}</p>

        <p className="mt-6 text-center text-6xl font-bold text-slate-800">
          {state.score}
          <span className="text-2xl font-medium text-slate-400"> / {state.total}</span>
        </p>
        <p className="mt-3 text-center text-xl font-semibold text-emerald-700">{state.result}</p>

        <dl className="mt-8 divide-y divide-slate-100 border-t border-slate-100 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between py-2">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>

        <Link
          to="/"
          className="mt-8 block rounded-xl bg-slate-800 py-3 text-center font-semibold text-white hover:bg-slate-900"
        >
          Nueva auditoría
        </Link>
      </div>
    </PageContainer>
  );
}