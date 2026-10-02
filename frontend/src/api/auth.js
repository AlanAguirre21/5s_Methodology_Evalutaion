import { api } from './client.js';

export const login = name => api('/auth/login', { method: 'POST', body: { name } });
export const getMe = () => api('/auth/me');
