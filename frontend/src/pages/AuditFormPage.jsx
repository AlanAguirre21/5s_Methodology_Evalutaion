import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import AreaAuditForm from '../components/AreaAuditForm.jsx';
import { getQuestionnaireOption } from '../constants/questionnaires.js';
import { startAudit } from '../api/audits.js';
import { listAreas } from '../api/areas.js';

export default function AuditFormPage() {
  const { questionnaireKey } = useParams();
  const navigate = useNavigate();

  const [areas, setAreas]           = useState(null);   // null = loading
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let active = true;
    listAreas()
      .then(items => { if (active) setAreas(items); })
      .catch(e => { if (active) { setAreas([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  const option = getQuestionnaireOption(questionnaireKey);

  if (!option) {
    return (
      <PageContainer>
        <StatusMessage error="Tipo de auditoría no válido." />
      </PageContainer>
    );
  }

  async function handleSubmit(fields) {
    setSubmitting(true);
    setError(null);

    try {
      const audit = await startAudit({ questionnaireKey, ...fields });
      navigate(`/audits/${audit.auditId}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  function handleAreaCreated(area) {
    setAreas(list => [...(list ?? []), area].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
  }

  return (
    <AreaAuditForm
      key={questionnaireKey}
      option={option}
      areas={areas}
      onSubmit={handleSubmit}
      onAreaCreated={handleAreaCreated}
      submitting={submitting}
      error={error}
    />
  );
}
