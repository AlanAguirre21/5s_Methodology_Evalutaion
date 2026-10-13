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

export const HEADER_FIELDS = {
  piso: [
    { key: 'costCenter', label: 'Centro de coste' },
    { key: 'area',       label: 'Área' },
    { key: 'evaluatedPerson', label: 'Persona a evaluar' },
    { key: 'supervisor', label: 'Supervisor' },
  ],
  oficina: [
    { key: 'department',    label: 'Área/Departamento' },
    { key: 'workshop',      label: 'Taller' },
    { key: 'evaluatedPerson', label: 'Persona a evaluar' },
    { key: 'supervisor',    label: 'Supervisor' },
  ],
};

// Fields chosen from the catalog; the supervisor is the logged-in user and the evaluated person is a registered user
const NOT_IN_CATALOG = ['supervisor', 'evaluatedPerson'];

export const CATALOG_FIELDS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([type, fields]) => [type, fields.filter(f => !NOT_IN_CATALOG.includes(f.key))])
);

// { piso: [[key, label], …], oficina: […] } — the columns of the audit tables
export const AUDIT_COLUMNS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([type, fields]) => [type, fields.map(f => [f.key, f.label])])
);
