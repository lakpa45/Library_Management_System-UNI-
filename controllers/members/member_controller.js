import pool from '../../db/connection.js';

// GET all members
export const getMembers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT member_id, first_name, last_name, email, phone,
                   member_type, department, card_no, roll_id, dob,
                   address, valid_till, registered_on, status
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

async function generateCardNo(memberType) {
    const prefixMap = { Student: 'STU', Faculty: 'FAC', Staff: 'STF' };
    const prefix = prefixMap[memberType] || 'STU';
    const year = new Date().getFullYear();

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM member WHERE card_no LIKE $1`,
        [`${prefix}-${year}-%`]
    );
    const nextNumber = countResult.rows[0].count + 1;
    const padded = String(nextNumber).padStart(4, '0');

    return `${prefix}-${year}-${padded}`;
}

// GET pending members
export const getPendingMembers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT member_id, first_name, last_name, email, phone, member_type, department, registered_on
             FROM member WHERE status = 'Pending' ORDER BY registered_on DESC`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// APPROVE a member
export const approveMember = async (req, res) => {
    try {
        const { id } = req.params;

        const memberResult = await pool.query('SELECT * FROM member WHERE member_id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const member = memberResult.rows[0];
        const cardNo = await generateCardNo(member.member_type);

        const result = await pool.query(
            `UPDATE member SET status = 'Approved', card_no = $1 WHERE member_id = $2 RETURNING member_id, first_name, card_no`,
            [cardNo, id]
        );

        res.status(200).json({ message: 'Member approved', member: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// REJECT a member
export const rejectMember = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE member SET status = 'Rejected' WHERE member_id = $1 RETURNING member_id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(200).json({ message: 'Member rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};