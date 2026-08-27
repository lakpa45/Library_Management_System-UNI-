import express from 'express';
import upload from '../middleware/upload.js';
import { getBooks, createBook, updateBook, deleteBook, searchBooks, getBookById, getAvailableBooks } from '../controllers/books/book_controller.js';
import { getFreeBooks } from '../controllers/books/free_books_controller.js';
import { optionalMemberAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/available', getAvailableBooks);
router.get('/search', searchBooks);
router.get('/free', getFreeBooks);
router.get('/:id', getBookById);
router.get('/', optionalMemberAuth, getBooks);
const bookUploads = upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'book_pdf', maxCount: 1 }
]);

router.post('/', bookUploads, createBook);
router.put('/:id', bookUploads, updateBook);
router.delete('/:id', deleteBook);

export default router;
