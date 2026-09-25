import express from 'express';
import * as ctrl from '../controllers/questionnaire.controller.js';

const router = express.Router();
router.get('/', ctrl.list);
export default router;