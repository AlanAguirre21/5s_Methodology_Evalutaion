import mongoose from 'mongoose';
import CatalogEntry from '../models/CatalogEntry.js';
import HttpError from '../utils/HttpError.js';
import { HEADER_FIELDS } from '../constants/headerFields.js';

function fieldsOf(questionnaireKey) {
  const fields = HEADER_FIELDS[questionnaireKey];
  if (!fields) throw new HttpError(404, 'Questionnaire not found');
  return fields;
}

export async function list(req, res) {
  const { questionnaireKey } = req.query;
  const fields = fieldsOf(questionnaireKey);

  const entries = await CatalogEntry.find({ questionnaireKey })
    .collation({ locale: 'es', numericOrdering: true })
    .sort({ value: 1 })
    .select('field value')
    .lean();

  const grouped = Object.fromEntries(fields.map(f => [f, []]));
  for (const e of entries) grouped[e.field]?.push({ _id: e._id, value: e.value });
  res.json(grouped);
}

export async function create(req, res) {
  const { questionnaireKey, field, value } = req.body;
  if (!fieldsOf(questionnaireKey).includes(field)) throw new HttpError(400, 'Invalid field');
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'value is required');

  try {
    const entry = await CatalogEntry.create({ questionnaireKey, field, value: value.trim() });
    res.status(201).json({ _id: entry._id, field: entry.field, value: entry.value });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Ya está registrado');
    throw err;
  }
}

export async function remove(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
  const entry = await CatalogEntry.findByIdAndDelete(req.params.id);
  if (!entry) throw new HttpError(404, 'Entry not found');
  res.status(204).end();
}
