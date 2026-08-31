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
        const cardNo = member.card_no || await generateCardNo(member.member_type);

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

// GET the logged-in member's own profile
export const getMyProfile = async (req, res) => {
    try {
        const user = req.user;
        let member;

        if (user.member_id || user.id) {
            const result = await pool.query(
                `SELECT member_id, first_name, last_name, email, phone, card_no,
                        member_type, department, status, registered_on, valid_till
                 FROM member WHERE member_id = $1`,
                [user.member_id || user.id]
            );
            member = result.rows[0];
        } else if (user.email) {
            const result = await pool.query(
                `SELECT member_id, first_name, last_name, email, phone, card_no,
                        member_type, department, status, registered_on, valid_till
                 FROM member WHERE LOWER(email) = LOWER($1)`,
                [user.email]
            );
            member = result.rows[0];
        }

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(200).json(member);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// UPDATE the logged-in member's own profile
export const updateMyProfile = async (req, res) => {
    try {
        const user = req.user;
        const memberId = user.member_id || user.id;

        if (!memberId) {
            return res.status(400).json({ message: 'Unable to identify member' });
        }

        const { first_name, last_name, email, phone } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const result = await pool.query(
            `UPDATE member SET first_name = $1, last_name = $2, email = $3, phone = $4
             WHERE member_id = $5
             RETURNING member_id, first_name, last_name, email, phone, card_no`,
            [first_name, last_name, email, phone || null, memberId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
