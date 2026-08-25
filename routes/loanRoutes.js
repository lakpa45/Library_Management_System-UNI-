import express from 'express';
import {
    getActiveLoans,
    searchMembers,
    searchAvailableBooks,
    issueBook,
    returnBook,
    getMyLoans,
    getMyActivity,
    renewMyLoan,
    borrowBook
} from '../controllers/loans/loan_controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/active', getActiveLoans);
router.get('/members/search', searchMembers);
router.get('/books/search', searchAvailableBooks);
router.post('/issue', issueBook);
router.put('/return/:id', returnBook);

router.get('/my-loans', verifyToken, getMyLoans);
router.get('/my-activity', verifyToken, getMyActivity);
router.put('/renew/:id', verifyToken, renewMyLoan);
router.post('/borrow', verifyToken, borrowBook);

export default router;