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
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'evaluatedPerson', label: 'Persona evaluada' },
  ],
  oficina: [
    { key: 'department',    label: 'Área/Departamento' },
    { key: 'evaluatedPerson', label: 'Persona evaluada' },
    { key: 'workshop',      label: 'Taller' },
    { key: 'supervisor',    label: 'Supervisor' },
  ],
};

// { piso: [[key, label], …], oficina: […] } — the columns of the audit tables
export const AUDIT_COLUMNS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([type, fields]) => [type, fields.map(f => [f.key, f.label])])
);
