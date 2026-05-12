import express from 'express';
import { masterLogin, masterVerify, refreshAppToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', masterLogin);
router.post('/verify', masterVerify);
router.post('/refresh', refreshAppToken);

export default router;
