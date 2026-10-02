import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import Audit from '../models/Audit.js';
import CatalogEntry from '../models/CatalogEntry.js';
import HttpError from '../utils/HttpError.js';
import { HEADER_FIELDS } from '../constants/headerFields.js';
import { computeResult } from '../services/evaluation.service.js';

function flatten(questionnaire) {
  return questionnaire.sections.flatMap(s =>
    s.questions.map(q => ({ id: q._id, text: q.text, section: { key: s.key, name: s.name } }))
  );
}

function buildState(audit, questionnaire) {
  const questions = flatten(questionnaire);
  const byId = new Map(questions.map(q => [q.id.toString(), q]));

  const history = audit.answers.map(a => {
    const q = byId.get(a.question.toString());
    return { question: q.text, section: q.section, answer: a.answer, deviation: a.deviation};
  });

  const base = {
    auditId: audit._id,
    questionnaireKey: questionnaire.key,
    title: questionnaire.title,
    costCenter: audit.costCenter,
    area: audit.area,
    supervisor: audit.supervisor,
    department: audit.department,
    workshop: audit.workshop,
    evaluatedPerson: audit.evaluatedPerson,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
    total: questions.length,
    history,
  };

  if (audit.status === 'completed') {
    return {
      ...base,
      status: 'completed',
      sectionScores: audit.sectionScores,
      score: audit.score,
      result: audit.result,
    };
  }

  const index = audit.answers.length;
  const q = questions[index];
  return { ...base, status: 'in_progress', index, section: q.section, question: { id: q.id, text: q.text } };
}

async function loadAudit(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid audit id');

  const audit = await Audit.findById(id);
  if (!audit) throw new HttpError(404, 'Audit not found');

  const questionnaire = await Questionnaire.findById(audit.questionnaire).lean();
  if (!questionnaire) throw new HttpError(500, 'Audit references missing questionnaire');

  return { audit, questionnaire };
}

function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${name} is required`);
  return value.trim();
}

export async function start({ questionnaireKey, ...body }, auditorId) {
  if (typeof questionnaireKey !== 'string') throw new HttpError(400, 'questionnaireKey is required');
  const names = HEADER_FIELDS[questionnaireKey];
  if (!names) throw new HttpError(404, 'Questionnaire not found');

  const fields = Object.fromEntries(names.map(n => [n, requireText(body[n], n)]));

  const registered = await Promise.all(names.map(n =>
    CatalogEntry.exists({ questionnaireKey, field: n, value: fields[n] })
  ));
  const missing = names.filter((n, i) => !registered[i]);
  if (missing.length) throw new HttpError(400, `Not registered: ${missing.join(', ')}`);

  const questionnaire = await Questionnaire.findOne({ key: questionnaireKey }).sort({ version: -1 }).lean();  // latest version
  if (!questionnaire) throw new HttpError(404, 'Questionnaire not found');

  const audit = await Audit.create({ questionnaire: questionnaire._id, auditor: auditorId, ...fields });
  return buildState(audit, questionnaire);
}

// id -> { key, total questions } of the questionnaires (every version) that match the filter
async function questionnaireInfo(filter) {
  const questionnaires = await Questionnaire.find(filter).select('key sections.questions._id').lean();
  return new Map(questionnaires.map(q => [
    q._id.toString(),
    { key: q.key, total: q.sections.reduce((n, s) => n + s.questions.length, 0) },
  ]));
}

function toListItem(a, info) {
  const questionnaire = info.get(a.questionnaire.toString());
  return {
    auditId: a._id,
    questionnaireKey: questionnaire?.key,
    status: a.status,
    createdAt: a.createdAt,
    completedAt: a.completedAt,
    answered: a.answers.length,
    total: questionnaire?.total,
    score: a.score,
    result: a.result,
    costCenter: a.costCenter,
    area: a.area,
    supervisor: a.supervisor,
    department: a.department,
    workshop: a.workshop,
    evaluatedPerson: a.evaluatedPerson,
  };
}

export async function list(questionnaireKey) {
  if (!HEADER_FIELDS[questionnaireKey]) throw new HttpError(404, 'Questionnaire not found');

  const info = await questionnaireInfo({ key: questionnaireKey });

  const audits = await Audit.find({ questionnaire: { $in: [...info.keys()] } })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return audits.map(a => toListItem(a, info));
}

function parseDate(value, name) {
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) throw new HttpError(400, `${name} must be a valid date`);
  return date;
}

// Audits made by one user, of every questionnaire type, started between "from" and "to" (default: the last year)
export async function listByAuditor(auditorId, from, to) {
  const end = to === undefined ? new Date() : parseDate(to, 'to');
  const start = from === undefined
    ? new Date(new Date(end).setFullYear(end.getFullYear() - 1))
    : parseDate(from, 'from');
  if (start > end) throw new HttpError(400, 'from must be before to');

  const info = await questionnaireInfo({});

  const audits = await Audit.find({ auditor: auditorId, createdAt: { $gte: start, $lte: end } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

  return audits.map(a => toListItem(a, info));
}

export async function getState(id) {
  const { audit, questionnaire } = await loadAudit(id);
  return buildState(audit, questionnaire);
}

export async function answer(id, index, value, deviation) {
  if (typeof value !== 'boolean') throw new HttpError(400, 'answer must be true or false');
  if (!Number.isInteger(index))  throw new HttpError(400, 'index must be an integer');
  if (value === false && (typeof deviation !== 'string' || !deviation.trim())) {
    throw new HttpError(400, 'deviation is required when answer is No');
  }

  const { audit, questionnaire } = await loadAudit(id);
  const questions = flatten(questionnaire);

  if (audit.status === 'completed')   throw new HttpError(409, 'Audit already completed');
  if (index !== audit.answers.length) throw new HttpError(409, 'Question index mismatch');

  audit.answers.push({ 
    question: questions[index].id, 
    answer: value,
    deviation: value ? null :deviation.trim(),
   });

  if (audit.answers.length === questions.length) {
    const { sectionScores, score, result } = computeResult(questionnaire, audit.answers);
    audit.sectionScores = sectionScores;
    audit.score = score;
    audit.result = result;
    audit.status = 'completed';
    audit.completedAt = new Date();
  }

  await audit.save();
  return buildState(audit, questionnaire);
}
