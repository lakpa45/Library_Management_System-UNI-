import express from 'express';
import { signup } from '../controllers/auth/sign_up.js';
import { signin } from '../controllers/auth/sign_in.js';

const router  = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);

export default router;