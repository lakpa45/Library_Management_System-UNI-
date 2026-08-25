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

// ISSUE a book (admin-initiated)
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

// GET the logged-in member's currently borrowed books
export const getMyLoans = async (req, res) => {
    try {
        const memberId = await resolveMemberId(req.user);
        if (!memberId) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const result = await pool.query(
            `SELECT b.book_id, b.title, b.cover_image, i.issue_id, i.issue_date, i.due_date
             FROM issue i
             JOIN book_copy bc ON i.copy_id = bc.copy_id
             JOIN book b ON bc.book_id = b.book_id
             WHERE i.member_id = $1 AND i.return_date IS NULL
             ORDER BY i.due_date ASC`,
            [memberId]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET the logged-in member's recent borrow/return history
export const getMyActivity = async (req, res) => {
    try {
        const memberId = await resolveMemberId(req.user);
        if (!memberId) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const result = await pool.query(
            `SELECT b.title, i.issue_date, i.due_date, i.return_date
             FROM issue i
             JOIN book_copy bc ON i.copy_id = bc.copy_id
             JOIN book b ON bc.book_id = b.book_id
             WHERE i.member_id = $1
             ORDER BY COALESCE(i.return_date, i.issue_date) DESC
             LIMIT 10`,
            [memberId]
        );

        const activity = result.rows.map((row) => ({
            title: row.title,
            action: row.return_date ? 'Returned' : 'Borrowed',
            date: row.return_date || row.issue_date
        }));

        res.status(200).json(activity);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// RENEW a loan (member-initiated — extends due date by 14 days)
export const renewMyLoan = async (req, res) => {
    try {
        const memberId = await resolveMemberId(req.user);
        if (!memberId) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const { id } = req.params;

        const issueResult = await pool.query(
            `SELECT * FROM issue WHERE issue_id = $1 AND member_id = $2 AND return_date IS NULL`,
            [id, memberId]
        );

        if (issueResult.rows.length === 0) {
            return res.status(404).json({ message: 'Active loan not found' });
        }

        const result = await pool.query(
            `UPDATE issue SET due_date = due_date + INTERVAL '14 days' WHERE issue_id = $1 RETURNING due_date`,
            [id]
        );

        res.status(200).json({ message: 'Loan renewed', due_date: result.rows[0].due_date });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// BORROW a book (self-service — the logged-in member borrows for themselves)
export const borrowBook = async (req, res) => {
    const client = await pool.connect();
    try {
        const memberId = await resolveMemberId(req.user);
        if (!memberId) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const { book_id } = req.body;
        if (!book_id) {
            return res.status(400).json({ message: 'book_id is required' });
        }

        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

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
            [issueDate.toISOString().slice(0, 10), dueDate.toISOString().slice(0, 10), memberId, copyId]
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

// Works whether the JWT payload has member_id directly, or only email
async function resolveMemberId(user) {
    if (!user) return null;
    if (user.member_id) return user.member_id;
    if (user.id) return user.id;
    if (user.email) {
        const result = await pool.query('SELECT member_id FROM member WHERE email = $1', [user.email]);
        return result.rows.length ? result.rows[0].member_id : null;
    }
    return null;
}