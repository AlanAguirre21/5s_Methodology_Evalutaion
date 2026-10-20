import { api } from './client.js';

export const listAreas  = () => api('/areas');
export const createArea = data => api('/areas', { method: 'POST', body: data });   // { name, costCenter?, manager: { name, email } }
export const updateArea = (id, data) => api(`/areas/${id}`, { method: 'PATCH', body: data });
export const deleteArea = id => api(`/areas/${id}`, { method: 'DELETE' });
