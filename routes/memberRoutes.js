import express from 'express';
import { getMembers, deleteMember, getPendingMembers, approveMember, rejectMember } from '../controllers/members/member_controller.js';

const router = express.Router();

router.get('/', getMembers);
router.get('/pending', getPendingMembers);
router.put('/:id/approve', approveMember);
router.put('/:id/reject', rejectMember);
router.delete('/:id', deleteMember);

export default router;