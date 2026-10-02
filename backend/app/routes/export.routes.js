import express from 'express';
import * as ctrl from '../controllers/export.controller.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/key', requireRole(ROLES.ADMIN), ctrl.getKey);
router.get('/audits.csv', ctrl.auditsCsv);   // ?questionnaireKey=piso|oficina&key= — no session: Power BI reads it with the key

export default router;
