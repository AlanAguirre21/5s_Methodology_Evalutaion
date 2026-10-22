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

// Every audit is started from an area: its cost center and manager (the evaluated person) come with it
const AREA_FIELDS = [
  { key: 'area',            label: 'Área' },
  { key: 'costCenter',      label: 'Centro de coste' },
  { key: 'evaluatedPerson', label: 'Persona evaluada' },
  { key: 'supervisor',      label: 'Supervisor' },
];

export const HEADER_FIELDS = {
  piso: AREA_FIELDS,
  oficina: AREA_FIELDS,
};

// { piso: [[key, label], …], oficina: […] } — the columns of the audit tables
export const AUDIT_COLUMNS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([type, fields]) => [type, fields.map(f => [f.key, f.label])])
);
