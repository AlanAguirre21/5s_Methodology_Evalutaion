import { useEffect, useState } from 'react';
import { getAudit, answerAudit } from '../api/audits.js';

export function useAudit(auditId) {
  const [state, setState]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getAudit(auditId)
      .then(s => { if (active) setState(s); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [auditId]);

  async function answer(value, deviation) {
    if (!state || state.status !== 'in_progress' || sending) return;
    setSending(true);
    setError(null);

    try {
      setState(await answerAudit(auditId, { index: state.index, answer: value, deviation }));
    } catch (e) {
      if (e.status === 409) {
        // Frontend is out of sync with the backend: reload the real state
        try { setState(await getAudit(auditId)); } catch (e2) { setError(e2.message); }
      } else {
        setError(e.message);
      }
    } finally {
      setSending(false);
    }
  }

  return { state, loading, sending, error, answer };
}