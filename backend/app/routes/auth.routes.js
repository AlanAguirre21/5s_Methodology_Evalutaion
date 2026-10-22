import express from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', ctrl.login);         // { email }
router.get('/me', requireAuth, ctrl.me);

export default router;
