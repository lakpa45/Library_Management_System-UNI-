import express from 'express';
import { signup } from '../controllers/auth/sign_up.js';
import { signin } from '../controllers/auth/sign_in.js';
import { librarianSignin } from '../controllers/auth/librarian_signin.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/librarian/signin', librarianSignin);

export default router;