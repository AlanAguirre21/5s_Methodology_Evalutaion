import { api } from './client.js';

export const listAreas     = ({ all = false } = {}) => api(`/areas${all ? '?all=true' : ''}`);
export const createArea    = data => api('/areas', { method: 'POST', body: data });   // { name, costCenter?, manager: { name, email } }
export const updateArea    = (id, data) => api(`/areas/${id}`, { method: 'PATCH', body: data });
export const setAreaActive = (id, active) => api(`/areas/${id}/active`, { method: 'PATCH', body: { active } });
