import { randomBytes, timingSafeEqual } from 'node:crypto';
import Setting from '../models/Setting.js';
import HttpError from '../utils/HttpError.js';
import * as auditService from '../services/audit.service.js';
import { HEADER_FIELDS, FIELD_LABELS } from '../constants/headerFields.js';

const EXPORT_KEY = 'exportKey';

async function exportKey() {
  const setting = await Setting.findOneAndUpdate(
    { key: EXPORT_KEY },
    { $setOnInsert: { value: randomBytes(24).toString('hex') } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return setting.value;
}

export async function getKey(req, res) {
  res.json({ key: await exportKey() });
}

const cell = value => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const isoDate = date => (date ? new Date(date).toISOString() : null);

export async function auditsCsv(req, res) {
  const given = Buffer.from(typeof req.query.key === 'string' ? req.query.key : '');
  const expected = Buffer.from(await exportKey());
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new HttpError(401, 'Clave de exportación no válida');
  }

  const { questionnaireKey } = req.query;
  const { sections, audits } = await auditService.exportData(questionnaireKey);
  const sectionScore = (a, key) => a.sectionScores.find(s => s.section === key);
  const done = a => a.status === 'completed';

  const columns = [
    ['Fecha de inicio', a => isoDate(a.createdAt)],
    ['Fecha de finalización', a => isoDate(a.completedAt)],
    ...HEADER_FIELDS[questionnaireKey].map(field => [FIELD_LABELS[field], a => a[field]]),
    ['Persona evaluada', a => a.evaluatedPerson],
    ['Estado', a => (done(a) ? 'Completada' : 'En curso')],
    ['Puntos', a => a.score],
    ['Total de preguntas', a => a.total],
    ['Calificación', a => (done(a) ? Math.round((a.score / a.total) * 100) : null)],
    ['Resultado', a => a.result],
    ...sections.flatMap(s => [
      [`${s.name} (puntos)`, a => sectionScore(a, s.key)?.score],
      [`${s.name} (máximo)`, a => sectionScore(a, s.key)?.max],
    ]),
  ];

  const lines = [
    columns.map(([header]) => cell(header)).join(','),
    ...audits.map(a => columns.map(([, value]) => cell(value(a))).join(',')),
  ];

  // The BOM makes Power BI and Excel read the accents as UTF-8
  res.type('text/csv; charset=utf-8').send('﻿' + lines.join('\r\n'));
}
