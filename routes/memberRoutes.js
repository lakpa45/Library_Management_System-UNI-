import express from 'express';
import { getMembers, deleteMember, getPendingMembers, approveMember, rejectMember, getMyProfile, updateMyProfile } from '../controllers/members/member_controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', verifyToken, getMyProfile);
router.put('/me', verifyToken, updateMyProfile);
router.get('/', getMembers);
router.get('/pending', getPendingMembers);
router.put('/:id/approve', approveMember);
router.put('/:id/reject', rejectMember);
router.delete('/:id', deleteMember);

export default router;