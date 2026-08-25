import express from 'express';
import upload from '../middleware/upload.js';
import { getBooks, createBook, updateBook, deleteBook, searchBooks, getBookById, getAvailableBooks } from '../controllers/books/book_controller.js';

const router = express.Router();

router.get('/available', getAvailableBooks);
router.get('/search', searchBooks);
router.get('/:id', getBookById);
router.get('/', getBooks);
router.post('/', upload.single('cover_image'), createBook);
router.put('/:id', upload.single('cover_image'), updateBook);
router.delete('/:id', deleteBook);

export default router;