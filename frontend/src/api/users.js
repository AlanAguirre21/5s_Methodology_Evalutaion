import { api } from './client.js';

export const listUsers      = () => api('/users');
export const createUser    = data => api('/users', { method: 'POST', body: data });
export const updateMe       = data => api('/users/me', { method: 'PATCH', body: data });   // { name?, email?, avatar? }
export const updateUser     = (id, data) => api(`/users/${id}`, { method: 'PATCH', body: data });   // admin; { name?, email?, avatar? }
export const updateUserRole = (id, role) => api(`/users/${id}/role`, { method: 'PATCH', body: { role } });
export const deleteUser     = id => api(`/users/${id}`, { method: 'DELETE' });
