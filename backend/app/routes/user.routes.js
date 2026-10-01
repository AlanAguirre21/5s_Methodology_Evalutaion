import express from 'express';
import * as ctrl from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', ctrl.create);             // { username, name, role? }

export default router;
