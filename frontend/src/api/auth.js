import { api } from './client.js';

export const login = username => api('/auth/login', { method: 'POST', body: { username } });
export const getMe = () => api('/auth/me');
