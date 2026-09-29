// Header fields of an audit, per questionnaire key.
// Each value must be registered in the catalog (People page) before it can be used in an audit.
export const HEADER_FIELDS = {
  piso:    ['costCenter', 'area', 'supervisor', 'creator'],
  oficina: ['department', 'contactPerson', 'workshop', 'supervisor', 'creator'],
};
