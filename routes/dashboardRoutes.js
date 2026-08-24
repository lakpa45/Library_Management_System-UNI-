import express from 'express';
import { getDashboardStats, getRecentActivity, getDueSoon } from '../controllers/dashboard/dashboard_controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', verifyToken, requireAdmin, getDashboardStats);
router.get('/activity', verifyToken, requireAdmin, getRecentActivity);
router.get('/due-soon', verifyToken, requireAdmin, getDueSoon);

export default router;