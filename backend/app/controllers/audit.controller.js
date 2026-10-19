import * as auditService from '../services/audit.service.js';

export async function start(req, res) {
  const { questionnaireKey, areaId } = req.body;
  res.status(201).json(await auditService.start({ questionnaireKey, areaId }, req.user));
}

export async function list(req, res) {
  res.json(await auditService.list(req.query.questionnaireKey));
}

export async function listMine(req, res) {
  res.json(await auditService.listMine(req.user, req.query.from, req.query.to));
}

export async function getState(req, res)  {
  res.json(await auditService.getState(req.params.id, req.user));
}

export async function answer(req, res) {
  const { index, answer, points, deviation, photo } = req.body;
  res.json(await auditService.answer(req.params.id, index, { answer, points, deviation, photo }, req.user));
}