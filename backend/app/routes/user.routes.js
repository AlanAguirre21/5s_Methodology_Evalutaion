import express from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', requireRole(ROLES.ADMIN), ctrl.list);
router.post('/', ctrl.create);                                        // { name, role? }
router.patch('/me', requireAuth, ctrl.updateMe);                      // { name?, avatar? }
router.patch('/:id/role', requireRole(ROLES.ADMIN), ctrl.updateRole); // { role }

export default router;
