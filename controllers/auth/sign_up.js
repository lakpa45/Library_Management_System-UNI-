import bcrypt from 'bcrypt';
import pool from '../../db/connection.js';

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

function generateTempPassword(first_name, dob) {
    const namePart = (first_name || 'User').slice(0, 4);
    const birthYear = new Date(dob).getFullYear();
    return `${namePart}${birthYear}`;
}

export const signup = async (req, res) => {
    try {
        const {
            first_name, last_name, email, phone, password,
            member_type, department, roll_id, dob, address, valid_till
        } = req.body;

        const existingResult = await pool.query(
            'SELECT * FROM member WHERE email = $1',
            [email]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const finalPassword = password || generateTempPassword(first_name, dob);
        const hashedPassword = await bcrypt.hash(finalPassword, 10);
        const cardNo = await generateCardNo(member_type);

        const insertResult = await pool.query(
            `INSERT INTO member (first_name, last_name, email, password, phone, member_type, department, card_no, roll_id, dob, address, valid_till)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING member_id, first_name, last_name, email, phone, member_type, department, card_no`,
            [first_name, last_name, email, hashedPassword, phone, member_type || 'Student', department, cardNo, roll_id || null, dob || null, address || null, valid_till || null]
        );

        const newMember = insertResult.rows[0];

        res.status(201).json({
            message: 'Sign up successful',
            member: newMember,
            temp_password: password ? undefined : finalPassword
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};