import pool from '../../db/connection.js';

// GET all books
export const getBooks = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM book ORDER BY book_id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// CREATE a book (with copies)
export const createBook = async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, description, category_id, copies } = req.body;
        const numCopies = parseInt(copies) || 1;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const cover_image = req.file ? `/images/books/${req.file.filename}` : null;

        await client.query('BEGIN');

        const bookResult = await client.query(
            `INSERT INTO book (title, description, cover_image, category_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [title, description, cover_image, category_id || null]
        );
        const book = bookResult.rows[0];

        for (let i = 0; i < numCopies; i++) {
            const barcode = `BK${book.book_id}-${Date.now()}-${i}`;
            await client.query(
                `INSERT INTO book_copy (barcode, status, book_id) VALUES ($1, 'Available', $2)`,
                [barcode, book.book_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(book);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// UPDATE a book
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category_id } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        let query;
        let values;

        if (req.file) {
            const cover_image = `/images/books/${req.file.filename}`;
            query = `UPDATE book SET title = $1, description = $2, cover_image = $3, category_id = $4 WHERE book_id = $5 RETURNING *`;
            values = [title, description, cover_image, category_id || null, id];
        } else {
            query = `UPDATE book SET title = $1, description = $2, category_id = $3 WHERE book_id = $4 RETURNING *`;
            values = [title, description, category_id || null, id];
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE a book
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM book WHERE book_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json({ message: 'Book deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// SEARCH books by title or category name
export const searchBooks = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.status(200).json([]);
        }
        const searchTerm = `%${q}%`;
        const result = await pool.query(
            `SELECT book.*, category.category_name
             FROM book
             LEFT JOIN category ON book.category_id = category.category_id
             WHERE book.title ILIKE $1 OR category.category_name ILIKE $1
             ORDER BY book.title ASC
             LIMIT 8`,
            [searchTerm]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET single book by id (with availability info)
export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT book.*, category.category_name,
                    COUNT(*) FILTER (WHERE book_copy.status = 'Available') AS available_copies,
                    COUNT(*) AS total_copies
             FROM book
             LEFT JOIN category ON book.category_id = category.category_id
             LEFT JOIN book_copy ON book_copy.book_id = book.book_id
             WHERE book.book_id = $1
             GROUP BY book.book_id, category.category_name`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET all books that currently have at least one available copy
export const getAvailableBooks = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT b.book_id, b.title, b.cover_image, c.category_name,
                    COUNT(bc.copy_id) FILTER (WHERE bc.status = 'Available') AS available_copies
             FROM book b
             LEFT JOIN category c ON b.category_id = c.category_id
             JOIN book_copy bc ON bc.book_id = b.book_id
             GROUP BY b.book_id, c.category_name
             HAVING COUNT(bc.copy_id) FILTER (WHERE bc.status = 'Available') > 0
             ORDER BY b.title ASC`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};