// Fields chosen from the catalog when an audit starts. The evaluated person is not one of them: it is always the logged-in user.
export const HEADER_FIELDS = {
  piso:    ['costCenter', 'area', 'supervisor'],
  oficina: ['workshop', 'department', 'supervisor'],
};

export const FIELD_LABELS = {
  costCenter: 'Centro de coste',
  area:       'Área',
  supervisor: 'Supervisor',
  department: 'Área/Departamento',
  workshop:   'Taller',
};

export const PHOTO_REQUIRED = ['oficina'];
