import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../../db/connection.js';
import { sendResetEmail } from '../../utils/mailer.js';

export const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const memberResult = await pool.query('SELECT member_id FROM member WHERE email = $1', [email]);

        // Always respond the same way, whether or not the email exists —
        // this prevents attackers from using this endpoint to discover valid emails
        if (memberResult.rows.length === 0) {
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await pool.query(
            'INSERT INTO password_reset (email, token, expires_at) VALUES ($1, $2, $3)',
            [email, token, expiresAt]
        );

        const clientUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
        const resetLink = `${clientUrl}/reset_password.html?token=${encodeURIComponent(token)}`;
        await sendResetEmail(email, resetLink);

        res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    const client = await pool.connect();
    try {
        const { token, newPassword } = req.body;

        if (!token || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 72) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        await client.query('BEGIN');

        const resetResult = await client.query(
            `SELECT * FROM password_reset
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()
             FOR UPDATE`,
            [token]
        );

        if (resetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'This reset link is invalid or has expired' });
        }

        const resetRow = resetResult.rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await client.query('UPDATE member SET password = $1 WHERE email = $2', [hashedPassword, resetRow.email]);
        await client.query('UPDATE password_reset SET used = TRUE WHERE reset_id = $1', [resetRow.reset_id]);
        await client.query('COMMIT');

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};
