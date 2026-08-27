import express from 'express';
import { verifyToken, requireMember } from '../middleware/auth.js';
import { getWishlist, addWishlistBook, removeWishlistBook } from '../controllers/wishlist/wishlist_controller.js';

const router = express.Router();
router.use(verifyToken, requireMember);
router.get('/', getWishlist);
router.post('/:bookId', addWishlistBook);
router.delete('/:bookId', removeWishlistBook);
export default router;
