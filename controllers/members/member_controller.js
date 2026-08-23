import pool from '../../db/connection.js';

// GET all members
export const getMembers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT member_id, first_name, last_name, email, phone,
                   member_type, department, card_no, roll_id, dob,
                   address, valid_till, registered_on
            FROM member
            ORDER BY registered_on DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE a member
export const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM member WHERE member_id = $1 RETURNING member_id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(200).json({ message: 'Member removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};