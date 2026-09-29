import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import FloorForm from '../components/FloorForm.jsx';
import OfficeForm from '../components/OfficeForm.jsx';
import { getQuestionnaireOption } from '../constants/questionnaires.js';
import { startAudit } from '../api/audits.js';

// questionnaireKey (from the HomePage card link) → form for that type
const FORMS = {
  piso: FloorForm,
  oficina: OfficeForm,
};

export default function AuditFormPage() {
  const { questionnaireKey } = useParams();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const option = getQuestionnaireOption(questionnaireKey);
  const Form = FORMS[questionnaireKey];

  if (!option || !Form) {
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

  // key resets the form state when switching between types
  return <Form key={questionnaireKey} option={option} onSubmit={handleSubmit} submitting={submitting} error={error} />;
}
