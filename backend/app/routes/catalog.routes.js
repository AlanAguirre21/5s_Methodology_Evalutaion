import express from 'express';
import * as ctrl from '../controllers/catalog.controller.js';

const router = express.Router();

router.get('/', ctrl.list);            // ?questionnaireKey=piso|oficina
router.post('/', ctrl.create);         // { questionnaireKey, field, value }
router.delete('/:id', ctrl.remove);

export default router;
