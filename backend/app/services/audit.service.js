import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import Audit from '../models/Audit.js';
import HttpError from '../utils/HttpError.js';
import { computeResult } from '../services/evaluation.service.js';

// Sections → one ordered list; the audit index walks through it
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
    title: questionnaire.title,
    costCenter: audit.costCenter,
    area: audit.area,
    supervisor: audit.supervisor,
    creator: audit.creator,
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

// Required free-text fields of the audit header
function requireText(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${name} is required`);
  return value.trim();
}

export async function start({ questionnaireKey, costCenter, area, supervisor, creator }) {
  if (typeof questionnaireKey !== 'string') throw new HttpError(400, 'questionnaireKey is required');
  const fields = {
    costCenter: requireText(costCenter, 'costCenter'),
    area:       requireText(area, 'area'),
    supervisor: requireText(supervisor, 'supervisor'),
    creator:    requireText(creator, 'creator'),
  };

  const questionnaire = await Questionnaire.findOne({ key: questionnaireKey }).sort({ version: -1 }).lean();  // latest version
  if (!questionnaire) throw new HttpError(404, 'Questionnaire not found');

  const audit = await Audit.create({ questionnaire: questionnaire._id, ...fields });
  return buildState(audit, questionnaire);
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
