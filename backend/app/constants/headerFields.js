// Fields an audit is started with. All come from the chosen area; the supervisor is always the logged-in user.
const AREA_FIELDS = ['area', 'costCenter', 'evaluatedPerson'];

export const HEADER_FIELDS = {
  piso:    AREA_FIELDS,
  oficina: AREA_FIELDS,
};

export const FIELD_LABELS = {
  area:            'Área',
  costCenter:      'Centro de coste',
  evaluatedPerson: 'Responsable',
};
