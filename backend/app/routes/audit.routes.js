import express from 'express';
import * as ctrl from '../controllers/audit.controller.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.post('/', requireRole(ROLES.ADMIN), ctrl.start);              // { questionnaireKey, evaluatedPerson, + piso: costCenter, area | oficina: department, workshop }
router.get('/', requireRole(ROLES.ADMIN), ctrl.list);   // ?questionnaireKey=piso|oficina
router.get('/mine', ctrl.listMine);        // ?from=&to= (ISO dates) — audits an admin made, or where an operator was evaluated
router.get('/:id', ctrl.getState);
router.post('/:id/answers', requireRole(ROLES.ADMIN), ctrl.answer);  // { index, answer }

export default router;