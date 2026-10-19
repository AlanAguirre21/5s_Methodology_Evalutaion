import express from 'express';
import * as ctrl from '../controllers/audit.controller.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.post('/', requireRole(ROLES.ADMIN), ctrl.start);              // { questionnaireKey, areaId }
router.get('/', requireRole(ROLES.ADMIN), ctrl.list);   // ?questionnaireKey=piso|oficina
router.get('/mine', ctrl.listMine);        // ?from=&to= (ISO dates) — completed audits where the user was evaluated
router.get('/:id', ctrl.getState);
router.post('/:id/answers', requireRole(ROLES.ADMIN), ctrl.answer);  // { index, answer, deviation? } | rating: { index, points, deviation? } | photo: { index, photo }

export default router;