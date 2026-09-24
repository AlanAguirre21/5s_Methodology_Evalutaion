import express from 'express';
import * as ctrl from '../controllers/area.controller.js';

const router = express.Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);             // { name }

export default router;