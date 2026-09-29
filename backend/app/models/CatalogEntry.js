import { Schema, model } from 'mongoose';
import { HEADER_FIELDS } from '../constants/headerFields.js';

const CatalogEntrySchema = new Schema({
    questionnaireKey: { type: String, required: true, enum: Object.keys(HEADER_FIELDS) },
    field:            { type: String, required: true },
    value:            { type: String, required: true, trim: true, maxlength: 100 },
}, { timestamps: true });

CatalogEntrySchema.index(
    { questionnaireKey: 1, field: 1, value: 1 },
    { unique: true, collation: { locale: 'es', strength: 1 } },
);

export default model('CatalogEntry', CatalogEntrySchema);
