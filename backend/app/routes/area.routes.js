import express from 'express';
import * as ctrl from '../controllers/area.controller.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', ctrl.list);
router.post('/', requireRole(ROLES.ADMIN), ctrl.create);                 // { name, costCenter?, manager: { name, email } } — also gives the manager a user
router.patch('/:id', requireRole(ROLES.ADMIN), ctrl.update);             // { name?, costCenter?, manager? } — a new manager also gets a user
router.delete('/:id', requireRole(ROLES.ADMIN), ctrl.remove);

export default router;
