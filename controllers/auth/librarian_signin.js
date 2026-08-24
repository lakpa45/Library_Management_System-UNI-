import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db/connection.js';

export const librarianSignin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM admins WHERE email = $1',
            [email]
        );
        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Cookie for page-load guarding (auto-sent by the browser on navigation)
        res.cookie('adminSession', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1h, matches JWT expiry
        });

        // Token in body — unchanged, still goes to localStorage for API calls
        res.status(200).json({ message: 'Sign in successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};