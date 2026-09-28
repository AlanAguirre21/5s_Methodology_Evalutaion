import { Factory, Building2 } from 'lucide-react';

export const QUESTIONNAIRE_OPTIONS = [
  {
    key: 'piso',
    title: 'Piso de planta',
    description: 'Áreas de producción, almacén y mantenimiento.',
    Icon: Factory,
  },
  {
    key: 'oficina',
    title: 'Oficina',
    description: 'Áreas administrativas y puestos de trabajo.',
    Icon: Building2,
  },
];

export const getQuestionnaireOption = key =>
  QUESTIONNAIRE_OPTIONS.find(o => o.key === key);