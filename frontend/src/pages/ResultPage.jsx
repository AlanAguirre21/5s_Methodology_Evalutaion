import { Link, Navigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import Avatar from '../components/chat/Avatar.jsx';
import { useAudit } from '../hooks/useAudit.js';
import { PANEL } from '../constants/styles.js';
import Button from '../components/Button.jsx';


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

    const details = [
        ['Centro de coste', state.costCenter],
        ['Área', state.area],
        ['Supervisor', state.supervisor],
        ['Área/Departamento', state.department],
        ['Taller', state.workshop],
        ['Persona evaluada', state.evaluatedPerson],
    ].filter(([, value]) => value);

  return (
    <PageContainer>
      <div className={`p-8 ${PANEL}`}>
        <div className="flex flex-col items-center">
          <Avatar size={42} />
          <p className="mt-3 text-center text-sm font-semibold text-zf-blue">{state.title}</p>
        </div>

        <p className="mt-6 text-center text-6xl font-semibold text-text">
          {state.score}
          <span className="text-2xl font-medium text-text-faint"> / {state.total}</span>
        </p>
        <p className="mt-3 text-center text-xl font-semibold text-accent">{state.result}</p>

        <dl className="mt-8   border-t border-white/60 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-white/40 py-2">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-medium text-text">{value}</dd>
            </div>
          ))}
        </dl>

        <Button as={Link} to={`/registro/${auditId}`} size="lg" className="mt-8">
          Ver mis respuestas
        </Button>

        <Button as={Link} to="/" variant="primary" size="lg" className="mt-3">
          Nueva auditoría
        </Button>
      </div>
    </PageContainer>
  );
}
