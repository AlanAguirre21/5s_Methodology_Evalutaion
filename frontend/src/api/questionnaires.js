// questionnaires.js
import { api } from './client.js';
export const listQuestionnaires = () => api('/questionnaires');