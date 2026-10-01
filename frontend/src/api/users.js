import { api } from './client.js';

export const createUser = data => api('/users', { method: 'POST', body: data });
