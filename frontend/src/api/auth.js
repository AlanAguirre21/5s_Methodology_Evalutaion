import { api } from './client.js';

export const login = email => api('/auth/login', { method: 'POST', body: { email } });
export const getMe = () => api('/auth/me');
