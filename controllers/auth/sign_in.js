import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db/connection.js';

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check for existing email
        const result = await pool.query(
            'SELECT * FROM member WHERE email = $1',
            [email]
        );

        const member = result.rows[0];

        if (!member) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // comparing the entered password with hashed password
        const isMatch = await bcrypt.compare(password, member.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // generate JWT token
        const token = jwt.sign(
            { id: member.member_id, email: member.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // send response
        res.status(200).json({
            message: 'Sign in successful',
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};