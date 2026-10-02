import { api } from './client.js';

export const listUsers      = () => api('/users');
export const createUser     = data => api('/users', { method: 'POST', body: data });
export const updateMe       = data => api('/users/me', { method: 'PATCH', body: data });   // { name?, avatar? }
export const updateUserRole = (id, role) => api(`/users/${id}/role`, { method: 'PATCH', body: { role } });
