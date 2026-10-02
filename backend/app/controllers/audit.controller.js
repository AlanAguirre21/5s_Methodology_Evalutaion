import * as auditService from '../services/audit.service.js';

export async function start(req, res) {
  const {
    questionnaireKey,
    supervisor, evaluatedPerson,           // piso + oficina
    costCenter, area,                      // piso
    department, workshop,                  // oficina
  } = req.body;
  res.status(201).json(await auditService.start({
    questionnaireKey, supervisor, evaluatedPerson, costCenter, area, department, workshop,
  }, req.user._id));
}

export async function list(req, res) {
  res.json(await auditService.list(req.query.questionnaireKey));
}

export async function listMine(req, res) {
  res.json(await auditService.listByAuditor(req.user._id, req.query.from, req.query.to));
}

export async function getState(req, res)  {
  res.json(await auditService.getState(req.params.id));
}

export async function answer(req, res) {
  const { index, answer, deviation } = req.body;
  res.json(await auditService.answer(req.params.id, index, answer, deviation));
}