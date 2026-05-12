import express from 'express';
import { login, signup,  verifyCode } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
// router.post('/refresh', refresh);
router.post('/verify', verifyCode);


export default router;