import { Schema, model } from 'mongoose';
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN } from './User.js';

export const AREA_COLLATION = { locale: 'es', strength: 1 };

const ManagerSchema = new Schema({
    name:  { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: EMAIL_MAX_LENGTH, match: EMAIL_PATTERN },
}, { _id: false });

const AreaSchema = new Schema({
    key:        { type: String, trim: true, match: /^[a-z0-9_]+$/ },   // only in the default areas (seed/default_areas.json)
    name:       { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    costCenter: { type: String, trim: true, maxlength: 100, default: '' },
    manager:    { type: ManagerSchema, default: null },   // the person evaluated; null in areas from before it existed
}, { timestamps: true });

AreaSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });

export const toPublicArea = a => ({
  id: String(a._id),
  name: a.name,
  costCenter: a.costCenter ?? '',
  manager: a.manager ?? null,
  isDefault: Boolean(a.key),
  createdAt: a.createdAt,
});

export default model('Area', AreaSchema);
