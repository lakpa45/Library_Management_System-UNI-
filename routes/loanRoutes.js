import express from 'express';
import {
    getActiveLoans,
    searchMembers,
    searchAvailableBooks,
    issueBook,
    returnBook
} from '../controllers/loans/loan_controller.js';

const router = express.Router();

router.get('/active', getActiveLoans);
router.get('/members/search', searchMembers);
router.get('/books/search', searchAvailableBooks);
router.post('/issue', issueBook);
router.put('/return/:id', returnBook);

export default router;