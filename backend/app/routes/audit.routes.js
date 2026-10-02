import express from 'express';
import * as ctrl from '../controllers/audit.controller.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.post('/', ctrl.start);              // { questionnaireKey, supervisor, + piso: costCenter, area | oficina: department, workshop }
router.get('/', requireRole(ROLES.ADMIN), ctrl.list);   // ?questionnaireKey=piso|oficina
router.get('/mine', ctrl.listMine);        // ?from=&to= (ISO dates) — audits made by the logged-in user, both types
router.get('/:id', ctrl.getState);
router.post('/:id/answers', ctrl.answer);  // { index, answer }

export default router;