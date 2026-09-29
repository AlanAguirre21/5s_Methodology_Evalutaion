// audits.js
import { api } from './client.js';

export const startAudit  = data => api('/audits', { method: 'POST', body: data });
export const listAudits  = questionnaireKey => api(`/audits?questionnaireKey=${encodeURIComponent(questionnaireKey)}`);
export const getAudit    = id   => api(`/audits/${id}`);
export const answerAudit = (id, data) => api(`/audits/${id}/answers`, { method: 'POST', body: data });