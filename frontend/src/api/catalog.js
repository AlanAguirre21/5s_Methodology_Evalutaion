// catalog.js — values registered on the People page
import { api } from './client.js';

export const listCatalog    = questionnaireKey => api(`/catalog?questionnaireKey=${encodeURIComponent(questionnaireKey)}`);
export const addCatalogEntry = data => api('/catalog', { method: 'POST', body: data });
export const deleteCatalogEntry = id => api(`/catalog/${id}`, { method: 'DELETE' });
