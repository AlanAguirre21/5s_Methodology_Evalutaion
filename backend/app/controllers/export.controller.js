import { randomBytes, timingSafeEqual } from 'node:crypto';
import Setting from '../models/Setting.js';
import HttpError from '../utils/HttpError.js';
import * as auditService from '../services/audit.service.js';
import { HEADER_FIELDS, FIELD_LABELS } from '../constants/headerFields.js';

const EXPORT_KEY = 'exportKey';
const KEY_BYTES = 8;  

async function exportKey() {
  const setting = await Setting.findOne({ key: EXPORT_KEY }).lean();
  if (setting?.value.length === KEY_BYTES * 2) return setting.value;

  const value = randomBytes(KEY_BYTES).toString('hex');
  await Setting.updateOne({ key: EXPORT_KEY }, { value }, { upsert: true });
  return value;
}

export async function getKey(req, res) {
  res.json({ key: await exportKey() });
}

const isoDate = date => (date ? new Date(date).toISOString() : null);
const text = value => (value === null || value === undefined ? '' : String(value));

const csvCell = value => (/[",\n\r]/.test(text(value)) ? `"${text(value).replace(/"/g, '""')}"` : text(value));

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const htmlCell = value => text(value).replace(/[&<>"]/g, c => HTML_ESCAPES[c]);

function toCsv(headers, rows) {
  return '﻿' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}

function toHtml(title, headers, rows) {
  const tr = (cells, tag) => `<tr>${cells.map(c => `<${tag}>${htmlCell(c)}</${tag}>`).join('')}</tr>`;
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${htmlCell(title)}</title></head>
<body>
<table>
<thead>${tr(headers, 'th')}</thead>
<tbody>
${rows.map(row => tr(row, 'td')).join('\n')}
</tbody>
</table>
</body>
</html>`;
}

export async function audits(req, res) {
  const given = Buffer.from(req.params.key);
  const expected = Buffer.from(await exportKey());
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new HttpError(401, 'Clave de exportación no válida');
  }

  const [, questionnaireKey, extension] = req.params.file.match(/^(.+?)(?:\.(json|csv|html))?$/);
  if (!HEADER_FIELDS[questionnaireKey]) throw new HttpError(404, 'Questionnaire not found');

  const { sections, audits: all } = await auditService.exportData(questionnaireKey);
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
  const headers = columns.map(([header]) => header);
  const rows = all.map(a => columns.map(([, value]) => value(a)));

  if (extension === 'html') {
    res.type('html').send(toHtml(`Evaluaciones 5S - ${questionnaireKey}`, headers, rows));
  } else if (extension === 'json') {
    res.json(rows.map(row => Object.fromEntries(headers.map((header, i) => [header, row[i] ?? null]))));
  } else {
    res.attachment(`evaluaciones-5s-${questionnaireKey}.csv`).type('text/csv; charset=utf-8').send(toCsv(headers, rows));
  }
}
