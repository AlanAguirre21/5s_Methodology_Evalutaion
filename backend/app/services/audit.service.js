import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import Audit from '../models/Audit.js';
import Area from '../models/Area.js';
import HttpError from '../utils/HttpError.js';
import { computeResult } from '../services/evaluation.service.js';

// Sections → one ordered list; the audit index walks through it
function flatten(questionnaire) {
  return questionnaire.sections.flatMap(s =>
    s.questions.map(q => ({ id: q._id, text: q.text, section: { key: s.key, name: s.name } }))
  );
}

function buildState(audit, questionnaire, areaName) {
  const questions = flatten(questionnaire);
  const base = {
    auditId: audit._id,
    title: questionnaire.title,
    area: areaName,
    supervisor: audit.supervisor,
    total: questions.length,
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

  const [questionnaire, area] = await Promise.all([
    Questionnaire.findById(audit.questionnaire).lean(),
    Area.findById(audit.area).lean(),
  ]);
  if (!questionnaire || !area) throw new HttpError(500, 'Audit references missing data');

  return { audit, questionnaire, area };
}

export async function start({ questionnaireKey, areaId, supervisor }) {
  if (typeof questionnaireKey !== 'string') throw new HttpError(400, 'questionnaireKey is required');
  if (!mongoose.isValidObjectId(areaId))    throw new HttpError(400, 'Invalid areaId');
  if (typeof supervisor !== 'string' || !supervisor.trim()) {
    throw new HttpError(400, 'supervisor is required');
  }

  const [questionnaire, area] = await Promise.all([
    Questionnaire.findOne({ key: questionnaireKey }).sort({ version: -1 }).lean(),  // latest version
    Area.findOne({ _id: areaId, active: true }).lean(),
  ]);
  if (!questionnaire) throw new HttpError(404, 'Questionnaire not found');
  if (!area)          throw new HttpError(404, 'Area not found or inactive');

  const audit = await Audit.create({
    questionnaire: questionnaire._id,
    area: area._id,
    supervisor: supervisor.trim(),
  });
  return buildState(audit, questionnaire, area.name);
}

export async function getState(id) {
  const { audit, questionnaire, area } = await loadAudit(id);
  return buildState(audit, questionnaire, area.name);
}

export async function answer(id, index, value) {
  if (typeof value !== 'boolean') throw new HttpError(400, 'answer must be true or false');
  if (!Number.isInteger(index))  throw new HttpError(400, 'index must be an integer');

  const { audit, questionnaire, area } = await loadAudit(id);
  const questions = flatten(questionnaire);

  if (audit.status === 'completed')   throw new HttpError(409, 'Audit already completed');
  if (index !== audit.answers.length) throw new HttpError(409, 'Question index mismatch');

  audit.answers.push({ question: questions[index].id, answer: value });

  if (audit.answers.length === questions.length) {
    const { sectionScores, score, result } = computeResult(questionnaire, audit.answers);
    audit.sectionScores = sectionScores;
    audit.score = score;
    audit.result = result;
    audit.status = 'completed';
    audit.completedAt = new Date();
  }

  await audit.save();
  return buildState(audit, questionnaire, area.name);
}
