import express from 'express';
import * as ctrl from '../controllers/audit.controller.js';

const router = express.Router();

router.post('/', ctrl.start);              // { questionnaireKey, areaId, supervisor }
router.get('/:id', ctrl.getState);
router.post('/:id/answers', ctrl.answer);  // { index, answer }

export default router;