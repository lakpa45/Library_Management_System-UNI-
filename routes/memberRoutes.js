import express from 'express';
import { getMembers, deleteMember } from '../controllers/members/member_controller.js';

const router = express.Router();

router.get('/', getMembers);
router.delete('/:id', deleteMember);

export default router;