import express from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', requireRole(ROLES.ADMIN), ctrl.list);
router.post('/', ctrl.create);                                       // { name, email, role? }
router.patch('/me', requireAuth, ctrl.updateMe);                      // { name?, email?, avatar? }
router.patch('/:id', requireRole(ROLES.ADMIN), ctrl.update);          // { name?, email?, avatar? }
router.patch('/:id/role', requireRole(ROLES.ADMIN), ctrl.updateRole); // { role }
router.delete('/:id', requireRole(ROLES.ADMIN), ctrl.remove);           // never the control user, yourself, the last admin or an area manager

export default router;
