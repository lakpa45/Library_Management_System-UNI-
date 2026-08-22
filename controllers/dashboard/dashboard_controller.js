import pool from '../../db/connection.js';

export const getDashboardStats = async (req, res) => {
    try {
        const booksResult = await pool.query('SELECT COUNT(*)::int AS count FROM book');

        const borrowersResult = await pool.query(
            `SELECT COUNT(DISTINCT member_id)::int AS count
             FROM issue
             WHERE return_date IS NULL`
        );

        const overdueResult = await pool.query(
            `SELECT COUNT(*)::int AS count
             FROM issue
             WHERE return_date IS NULL AND due_date < CURRENT_DATE`
        );

        res.status(200).json({
            books: booksResult.rows[0].count,
            borrowers: borrowersResult.rows[0].count,
            overdue: overdueResult.rows[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};