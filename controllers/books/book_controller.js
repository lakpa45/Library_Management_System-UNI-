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

// CREATE a book
export const createBook = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const cover_image = req.file ? `/images/books/${req.file.filename}` : null;

        const result = await pool.query(
            `INSERT INTO book (title, description, cover_image)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [title, description, cover_image]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// UPDATE a book
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        let query;
        let values;

        if (req.file) {
            const cover_image = `/images/books/${req.file.filename}`;
            query = `UPDATE book SET title = $1, description = $2, cover_image = $3 WHERE book_id = $4 RETURNING *`;
            values = [title, description, cover_image, id];
        } else {
            query = `UPDATE book SET title = $1, description = $2 WHERE book_id = $3 RETURNING *`;
            values = [title, description, id];
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