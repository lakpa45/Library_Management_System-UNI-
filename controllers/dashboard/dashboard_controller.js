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

// GET recent circulation activity (issues + returns)
export const getRecentActivity = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.first_name, m.last_name, b.title,
                    i.issue_date, i.due_date, i.return_date
             FROM issue i
             JOIN member m ON i.member_id = m.member_id
             JOIN book_copy bc ON i.copy_id = bc.copy_id
             JOIN book b ON bc.book_id = b.book_id
             ORDER BY COALESCE(i.return_date, i.issue_date) DESC
             LIMIT 10`
        );

        const activity = result.rows.map((row) => {
            const isReturned = !!row.return_date;
            const isOverdue = !isReturned && new Date(row.due_date) < new Date();
            return {
                member: `${row.first_name} ${row.last_name}`,
                title: row.title,
                action: isReturned ? 'Returned' : 'Issued',
                date: isReturned ? row.return_date : row.issue_date,
                status: isReturned ? 'Completed' : (isOverdue ? 'Overdue' : 'Active')
            };
        });

        res.status(200).json(activity);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET books due soon (not yet returned), soonest first
export const getDueSoon = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.first_name, m.last_name, b.title, i.due_date
             FROM issue i
             JOIN member m ON i.member_id = m.member_id
             JOIN book_copy bc ON i.copy_id = bc.copy_id
             JOIN book b ON bc.book_id = b.book_id
             WHERE i.return_date IS NULL
             ORDER BY i.due_date ASC
             LIMIT 8`
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueSoon = result.rows.map((row) => {
            const dueDate = new Date(row.due_date);
            const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
            return {
                member: `${row.first_name} ${row.last_name}`,
                title: row.title,
                due_date: row.due_date,
                days_remaining: diffDays
            };
        });

        res.status(200).json(dueSoon);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};