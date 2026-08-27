import express from 'express';
import { createLibrarian, getLibrarians } from '../controllers/librarians/librarian_controller.js';
import { requireAdminOnly, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireAdminOnly);
router.get('/', getLibrarians);
router.post('/', createLibrarian);

export default router;
