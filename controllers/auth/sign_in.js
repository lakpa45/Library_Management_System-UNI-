import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db/connection.js';

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const member = await pool.query(
            'SELECT * FROM member WHERE email = $1',
            [email]
        ).then(r => r.rows[0]);

        if (!member) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, member.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: member.member_id, email: member.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Sign in successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};