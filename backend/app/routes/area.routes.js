import express from 'express';
import * as ctrl from '../controllers/area.controller.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', ctrl.list);                                              // ?all=true (admin) includes inactive areas
router.post('/', requireRole(ROLES.ADMIN), ctrl.create);                 // { name, costCenter?, manager: { name, email } } — also gives the manager a user
router.patch('/:id', requireRole(ROLES.ADMIN), ctrl.update);             // { name?, costCenter?, manager? } — a new manager also gets a user
router.patch('/:id/active', requireRole(ROLES.ADMIN), ctrl.setActive);   // { active }

export default router;
