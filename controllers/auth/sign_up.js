import bcrypt from 'bcrypt';
import pool from '../../db/connection.js';

export const signup = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password } = req.body;

        // checks if member already exists
        const existingResult = await pool.query(
            'SELECT * FROM member WHERE email = $1',
            [email]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create a new member
        const insertResult = await pool.query(
            `INSERT INTO member (first_name, last_name, email, password, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING member_id, first_name, last_name, email, phone`,
            [first_name, last_name, email, hashedPassword, phone]
        );

        const newMember = insertResult.rows[0];

        // send response
        res.status(201).json({
            message: 'Sign up successful',
            member: {
                id: newMember.member_id,
                first_name: newMember.first_name,
                last_name: newMember.last_name,
                email: newMember.email,
                phone: newMember.phone
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};