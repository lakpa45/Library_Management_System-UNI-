import pool from '../../db/connection.js';

const FINE_PER_DAY = 5;

// GET active loans
export const getActiveLoans = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.issue_id, i.issue_date, i.due_date, i.return_date,
                   m.member_id, m.first_name, m.last_name,
                   bc.copy_id, b.book_id, b.title
            FROM issue i
            JOIN member m ON m.member_id = i.member_id
            JOIN book_copy bc ON bc.copy_id = i.copy_id
            JOIN book b ON b.book_id = bc.book_id
            WHERE i.return_date IS NULL
            ORDER BY i.due_date ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// SEARCH members
export const searchMembers = async (req, res) => {
    try {
        const { q } = req.query;
        const result = await pool.query(
            `SELECT member_id, first_name, last_name, email
             FROM member
             WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
             LIMIT 10`,
            [`%${q}%`]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// SEARCH available books (with an available copy)
export const searchAvailableBooks = async (req, res) => {
    try {
        const { q } = req.query;
        const result = await pool.query(
            `SELECT b.book_id, b.title,
                    COUNT(bc.copy_id) FILTER (WHERE bc.status = 'Available') AS available_copies
             FROM book b
             JOIN book_copy bc ON bc.book_id = b.book_id
             WHERE b.title ILIKE $1
             GROUP BY b.book_id, b.title
             HAVING COUNT(bc.copy_id) FILTER (WHERE bc.status = 'Available') > 0
             LIMIT 10`,
            [`%${q}%`]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ISSUE a book
export const issueBook = async (req, res) => {
    const client = await pool.connect();
    try {
        const { member_id, book_id, issue_date, due_date } = req.body;

        if (!member_id || !book_id || !due_date) {
            return res.status(400).json({ message: 'Member, book, and due date are required' });
        }

        await client.query('BEGIN');

        const copyResult = await client.query(
            `SELECT copy_id FROM book_copy
             WHERE book_id = $1 AND status = 'Available'
             LIMIT 1 FOR UPDATE`,
            [book_id]
        );

        if (copyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No available copies for this book' });
        }

        const copyId = copyResult.rows[0].copy_id;

        await client.query(
            `UPDATE book_copy SET status = 'Issued' WHERE copy_id = $1`,
            [copyId]
        );

        const issueResult = await client.query(
            `INSERT INTO issue (issue_date, due_date, member_id, copy_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [issue_date, due_date, member_id, copyId]
        );

        await client.query('COMMIT');
        res.status(201).json(issueResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// RETURN a book
export const returnBook = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { return_date } = req.body;

        await client.query('BEGIN');

        const issueResult = await client.query(
            `SELECT * FROM issue WHERE issue_id = $1 AND return_date IS NULL`,
            [id]
        );

        if (issueResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Active loan not found' });
        }

        const loan = issueResult.rows[0];
        const actualReturnDate = return_date || new Date().toISOString().slice(0, 10);

        const overdueDays = Math.max(0,
            Math.round((new Date(actualReturnDate) - new Date(loan.due_date)) / 86400000)
        );
        const fine = overdueDays * FINE_PER_DAY;

        await client.query(
            `UPDATE issue SET return_date = $1 WHERE issue_id = $2`,
            [actualReturnDate, id]
        );

        await client.query(
            `UPDATE book_copy SET status = 'Available' WHERE copy_id = $1`,
            [loan.copy_id]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Book returned', fine });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};