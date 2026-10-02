import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import FloorForm from '../components/FloorForm.jsx';
import OfficeForm from '../components/OfficeForm.jsx';
import { getQuestionnaireOption, CATALOG_FIELDS } from '../constants/questionnaires.js';
import { startAudit } from '../api/audits.js';
import { listCatalog } from '../api/catalog.js';

const FORMS = {
  piso: FloorForm,
  oficina: OfficeForm,
};

export default function AuditFormPage() {
  const { questionnaireKey } = useParams();
  const navigate = useNavigate();

  const [catalogState, setCatalogState] = useState({ key: null, data: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    const fields = CATALOG_FIELDS[questionnaireKey];
    if (!fields) return;
    let active = true;
    setError(null);      
    setSubmitting(false);

    listCatalog(questionnaireKey)
      .then(c => { if (active) setCatalogState({ key: questionnaireKey, data: c }); })
      .catch(e => {
        if (!active) return;
        setCatalogState({ key: questionnaireKey, data: Object.fromEntries(fields.map(f => [f.key, []])) });   
        setError(e.message);
      });

    return () => { active = false; };
  }, [questionnaireKey]);

  const option = getQuestionnaireOption(questionnaireKey);
  const catalog = catalogState.key === questionnaireKey ? catalogState.data : null;   // null = loading
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

  return <Form key={questionnaireKey} option={option} catalog={catalog} onSubmit={handleSubmit} submitting={submitting} error={error} />;
}
