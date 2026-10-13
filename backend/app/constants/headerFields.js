// Fields chosen when an audit starts. The supervisor is not one of them: it is always the logged-in user.
export const HEADER_FIELDS = {
  piso:    ['costCenter', 'area', 'evaluatedPerson'],
  oficina: ['workshop', 'department', 'evaluatedPerson'],
};

export const CATALOG_FIELDS = Object.fromEntries(
  Object.entries(HEADER_FIELDS).map(([key, fields]) => [key, fields.filter(f => f !== 'evaluatedPerson')])
);

export const FIELD_LABELS = {
  costCenter:      'Centro de coste',
  area:            'Área',
  evaluatedPerson: 'Persona evaluada',
  department:      'Área/Departamento',
  workshop:        'Taller',
};

export const PHOTO_REQUIRED = ['oficina'];
