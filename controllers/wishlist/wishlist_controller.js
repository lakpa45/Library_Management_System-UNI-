import pool from '../../db/connection.js';

const memberId = req => req.user.id;
const validBookId = value => Number.isInteger(Number(value)) && Number(value) > 0;

export const getWishlist = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT w.book_id, w.created_at, b.title, b.isbn, b.description, b.cover_image,
                    b.category_id, c.category_name,
                    COUNT(bc.copy_id)::int AS total_copies,
                    COUNT(bc.copy_id) FILTER (WHERE LOWER(bc.status) = 'available')::int AS available_copies
             FROM wishlist w JOIN book b ON b.book_id = w.book_id
             LEFT JOIN category c ON c.category_id = b.category_id
             LEFT JOIN book_copy bc ON bc.book_id = b.book_id
             WHERE w.member_id = $1
             GROUP BY w.wishlist_id, b.book_id, c.category_name
             ORDER BY w.created_at DESC`, [memberId(req)]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Wishlist read failed:', error.message);
        res.status(500).json({ message: 'Unable to load wishlist' });
    }
};

export const addWishlistBook = async (req, res) => {
    if (!validBookId(req.params.bookId)) return res.status(400).json({ message: 'Invalid book ID' });
    try {
        const book = await pool.query('SELECT book_id FROM book WHERE book_id = $1', [req.params.bookId]);
        if (!book.rowCount) return res.status(404).json({ message: 'Book not found' });
        await pool.query(
            `INSERT INTO wishlist (member_id, book_id) VALUES ($1, $2)
             ON CONFLICT (member_id, book_id) DO NOTHING`, [memberId(req), req.params.bookId]
        );
        res.status(201).json({ message: 'Book added to wishlist', wishlisted: true });
    } catch (error) {
        console.error('Wishlist add failed:', error.message);
        res.status(500).json({ message: 'Unable to update wishlist' });
    }
};

export const removeWishlistBook = async (req, res) => {
    if (!validBookId(req.params.bookId)) return res.status(400).json({ message: 'Invalid book ID' });
    try {
        await pool.query('DELETE FROM wishlist WHERE member_id = $1 AND book_id = $2', [memberId(req), req.params.bookId]);
        res.json({ message: 'Book removed from wishlist', wishlisted: false });
    } catch (error) {
        console.error('Wishlist removal failed:', error.message);
        res.status(500).json({ message: 'Unable to update wishlist' });
    }
};
