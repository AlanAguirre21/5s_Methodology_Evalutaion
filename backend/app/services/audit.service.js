import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import Audit, { PHOTO_MAX_LENGTH, PHOTO_PATTERN } from '../models/Audit.js';
import Area from '../models/Area.js';
import HttpError from '../utils/HttpError.js';
import User from '../models/User.js';
import { HEADER_FIELDS } from '../constants/headerFields.js';
import { computeResult, maxPoints, questionType, RATING_MAX } from '../services/evaluation.service.js';
import { ROLES } from '../constants/roles.js';

function flatten(questionnaire) {
  return questionnaire.sections.flatMap(s =>
    s.questions.map(q => ({ id: q._id, text: q.text, type: questionType(questionnaire, q), section: { key: s.key, name: s.name } }))
  );
}

const totals = questions => ({
  total: questions.reduce((n, q) => n + maxPoints(q.type), 0),
  questions: questions.filter(q => maxPoints(q.type) > 0).length,
});

function buildState(audit, questionnaire) {
  const questions = flatten(questionnaire);
  const byId = new Map(questions.map(q => [q.id.toString(), q]));

  const history = audit.answers.map(a => {
    const q = byId.get(a.question.toString());
    return { question: q.text, type: q.type, section: q.section, answer: a.answer, points: a.points ?? null, deviation: a.deviation, photo: a.photo ?? null };
  });

  const base = {
    auditId: audit._id,
    questionnaireKey: questionnaire.key,
    title: questionnaire.title,
    costCenter: audit.costCenter,
    area: audit.area ?? audit.department,
    supervisor: audit.supervisor,
    department: audit.department,
    workshop: audit.workshop,
    evaluatedPerson: audit.evaluatedPerson,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
    ...totals(questions),
    steps: questions.length,
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
  return { ...base, status: 'in_progress', index, section: q.section, question: { id: q.id, text: q.text, type: q.type } };
}

const evaluatedFilter = user => ({ $or: [
  { evaluated: user._id },
  ...(user.email ? [{ evaluatedEmail: user.email }] : []),
  { evaluated: null, evaluatedEmail: null, evaluatedPerson: user.name },
] });

function isEvaluated(audit, user) {
  if (audit.evaluated?.equals(user._id)) return true;
  if (audit.evaluatedEmail) return audit.evaluatedEmail === user.email;
  return !audit.evaluated && audit.evaluatedPerson === user.name;
}

async function loadAudit(id, user) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid audit id');

  const audit = await Audit.findById(id);
  if (!audit) throw new HttpError(404, 'Audit not found');
  if (user.role !== ROLES.ADMIN && !isEvaluatedNow(audit, user, (await areaManagers()).managerOf)) {
    throw new HttpError(403, 'Solo puedes consultar tus propias evaluaciones');
  }

  const questionnaire = await Questionnaire.findById(audit.questionnaire).lean();
  if (!questionnaire) throw new HttpError(500, 'Audit references missing questionnaire');

  return { audit, questionnaire };
}

export async function start({ questionnaireKey, areaId }, user) {
  if (typeof questionnaireKey !== 'string') throw new HttpError(400, 'questionnaireKey is required');
  if (!HEADER_FIELDS[questionnaireKey]) throw new HttpError(404, 'Questionnaire not found');
  if (!mongoose.isValidObjectId(areaId)) throw new HttpError(400, 'areaId is required');

  const area = await Area.findOne({ _id: areaId, active: true }).lean();
  if (!area) throw new HttpError(400, 'El área no existe o está desactivada');
  if (!area.manager) throw new HttpError(400, 'El área no tiene responsable. Agrégalo en Áreas.');

  const managerUser = await User.findOne({ email: area.manager.email, active: true }).select('_id').lean();

  const questionnaire = await Questionnaire.findOne({ key: questionnaireKey }).sort({ version: -1 }).lean();  // latest version
  if (!questionnaire) throw new HttpError(404, 'Questionnaire not found');

  const audit = await Audit.create({
    questionnaire: questionnaire._id,
    auditor: user._id,
    supervisor: user.name,
    areaRef: area._id,
    area: area.name,
    costCenter: area.costCenter || null,
    evaluatedPerson: area.manager.name,
    evaluatedEmail: area.manager.email,
    evaluated: managerUser?._id ?? null,
  });
  return buildState(audit, questionnaire);
}

const QUESTIONNAIRE_INFO_FIELDS = 'key answerType sections.key sections.name sections.questions._id sections.questions.type';

const toInfo = questionnaire => ({ key: questionnaire.key, ...totals(flatten(questionnaire)) });

async function questionnaireInfo(filter) {
  const questionnaires = await Questionnaire.find(filter).select(QUESTIONNAIRE_INFO_FIELDS).lean();
  return new Map(questionnaires.map(q => [q._id.toString(), toInfo(q)]));
}

function toListItem(a, info) {
  const questionnaire = info.get(a.questionnaire.toString());
  return {
    auditId: a._id,
    questionnaireKey: questionnaire?.key,
    status: a.status,
    createdAt: a.createdAt,
    completedAt: a.completedAt,
    answered: a.answers.filter(x => x.answer !== null || x.points !== null).length,
    total: questionnaire?.total,
    questions: questionnaire?.questions,
    score: a.score,
    result: a.result,
    costCenter: a.costCenter,
    area: a.area ?? a.department,
    supervisor: a.supervisor,
    department: a.department,
    workshop: a.workshop,
    evaluatedPerson: a.evaluatedPerson,
    evaluatedEmail: a.evaluatedEmail ?? null,
    evaluated: a.evaluated ?? null,
    auditor: a.auditor ?? null,
  };
}

// The evaluated person shown in the record and the export is the current manager of the audit's area
// (by reference, or by name in audits from before areas were registered); the name saved in the audit is the fallback.
async function areaManagers() {
  const areas = await Area.find().select('name manager').lean();
  const byId = new Map(areas.map(ar => [String(ar._id), ar]));
  const byName = new Map(areas.map(ar => [ar.name.toLocaleLowerCase('es'), ar]));
  const managerOf = a => (a.areaRef ? byId.get(String(a.areaRef)) : byName.get((a.area ?? a.department ?? '').toLocaleLowerCase('es')))?.manager;
  return { areas, managerOf };
}

function withManagers(items, audits, managerOf) {
  return items.map((item, i) => {
    const manager = managerOf(audits[i]);
    return manager ? { ...item, evaluatedPerson: manager.name, evaluatedEmail: manager.email } : item;
  });
}

async function withAreaManagers(items, audits) {
  const { managerOf } = await areaManagers();
  return withManagers(items, audits, managerOf);
}

function isEvaluatedNow(audit, user, managerOf) {
  const manager = managerOf(audit);
  return manager ? Boolean(user.email) && manager.email === user.email : isEvaluated(audit, user);
}

export async function list(questionnaireKey) {
  if (!HEADER_FIELDS[questionnaireKey]) throw new HttpError(404, 'Questionnaire not found');

  const info = await questionnaireInfo({ key: questionnaireKey });

  const audits = await Audit.find({ questionnaire: { $in: [...info.keys()] } })
    .select('-answers.photo')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return withAreaManagers(audits.map(a => toListItem(a, info)), audits);
}

// Every audit of one type, with the points of each section, for the Power BI export
export async function exportData(questionnaireKey) {
  if (!HEADER_FIELDS[questionnaireKey]) throw new HttpError(404, 'Questionnaire not found');

  const questionnaires = await Questionnaire.find({ key: questionnaireKey })
    .sort({ version: -1 })
    .select(QUESTIONNAIRE_INFO_FIELDS)
    .lean();

  const info = new Map(questionnaires.map(q => [q._id.toString(), toInfo(q)]));

  const sections = [];
  for (const q of questionnaires) {
    for (const s of q.sections) {
      if (!s.questions.some(question => maxPoints(questionType(q, question)) > 0)) continue;
      if (!sections.some(known => known.key === s.key)) sections.push({ key: s.key, name: s.name });
    }
  }

  const audits = await Audit.find({ questionnaire: { $in: [...info.keys()] } }).select('-answers.photo').sort({ createdAt: -1 }).lean();

  return {
    sections,
    audits: await withAreaManagers(audits.map(a => ({ ...toListItem(a, info), sectionScores: a.sectionScores })), audits),
  };
}

function parseDate(value, name) {
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) throw new HttpError(400, `${name} must be a valid date`);
  return date;
}

// Completed audits of every questionnaire type started between "from" and "to" (default: the last year)
// where the user was the evaluated person
export async function listMine(user, from, to) {
  const end = to === undefined ? new Date() : parseDate(to, 'to');
  const start = from === undefined
    ? new Date(new Date(end).setFullYear(end.getFullYear() - 1))
    : parseDate(from, 'from');
  if (start > end) throw new HttpError(400, 'from must be before to');

  const info = await questionnaireInfo({});
  const { areas, managerOf } = await areaManagers();
  const managed = areas.filter(ar => user.email && ar.manager?.email === user.email);
  const names = managed.map(ar => ar.name);

  const candidates = await Audit.find({
    status: 'completed',
    createdAt: { $gte: start, $lte: end },
    $or: [
      ...evaluatedFilter(user).$or,
      { areaRef: { $in: managed.map(ar => ar._id) } },
      { areaRef: null, area: { $in: names } },
      { areaRef: null, area: null, department: { $in: names } },
    ],
  })
    .collation({ locale: 'es', strength: 2 })
    .select('-answers.photo')
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

  const audits = candidates.filter(a => isEvaluatedNow(a, user, managerOf));
  return withManagers(audits.map(a => toListItem(a, info)), audits, managerOf);
}

export async function getState(id, user) {
  const { audit, questionnaire } = await loadAudit(id, user);
  return buildState(audit, questionnaire);
}

function requireDeviation(deviation, when) {
  if (typeof deviation !== 'string' || !deviation.trim()) throw new HttpError(400, `deviation is required when ${when}`);
  return deviation.trim();
}

function toAnswer(question, { answer: value, points, deviation, photo }) {
  if (question.type === 'photo') {
    if (typeof photo !== 'string' || photo.length > PHOTO_MAX_LENGTH || !PHOTO_PATTERN.test(photo)) {
      throw new HttpError(400, 'photo must be a JPEG, PNG or WebP image of at most 1 MB');
    }
    return { question: question.id, photo };
  }

  if (question.type === 'rating') {
    if (!Number.isInteger(points) || points < 0 || points > RATING_MAX) throw new HttpError(400, `points must be 0 to ${RATING_MAX}`);
    return { question: question.id, points, deviation: points === 0 ? requireDeviation(deviation, 'points is 0') : null };
  }

  if (typeof value !== 'boolean') throw new HttpError(400, 'answer must be true or false');
  return { question: question.id, answer: value, deviation: value ? null : requireDeviation(deviation, 'answer is No') };
}

export async function answer(id, index, body, user) {
  if (!Number.isInteger(index))  throw new HttpError(400, 'index must be an integer');

  const { audit, questionnaire } = await loadAudit(id, user);
  const questions = flatten(questionnaire);

  if (audit.status === 'completed')   throw new HttpError(409, 'Audit already completed');
  if (index !== audit.answers.length) throw new HttpError(409, 'Question index mismatch');

  audit.answers.push(toAnswer(questions[index], body));

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
