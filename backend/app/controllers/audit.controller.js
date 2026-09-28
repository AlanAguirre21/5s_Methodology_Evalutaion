import * as auditService from '../services/audit.service.js';

export async function start(req, res) {
  const { questionnaireKey, costCenter, area, supervisor, creator } = req.body;
  res.status(201).json(await auditService.start({ questionnaireKey, costCenter, area, supervisor, creator }));
}

export async function getState(req, res)  {
  res.json(await auditService.getState(req.params.id));
}

export async function answer(req, res) {
  const { index, answer, deviation } = req.body;
  res.json(await auditService.answer(req.params.id, index, answer, deviation));
}