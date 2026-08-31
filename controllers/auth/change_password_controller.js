import bcrypt from 'bcrypt';
import pool from '../../db/connection.js';

const accountMap = {
  user: { table: 'member', idColumn: 'member_id' },
  librarian: { table: 'librarian', idColumn: 'librarian_id' },
  admin: { table: 'admins', idColumn: 'id' }
};

export const changePassword = async (req, res) => {
  const account = accountMap[req.user?.role];
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  if (!account) return res.status(403).json({ message: 'Access denied' });
  if (!currentPassword || newPassword.length < 8 || newPassword.length > 72) {
    return res.status(400).json({ message: 'The new password must contain between 8 and 72 characters.' });
  }

  try {
    const result = await pool.query(
      `SELECT password FROM ${account.table} WHERE ${account.idColumn} = $1`,
      [req.user.id]
    );
    if (!result.rowCount || !await bcrypt.compare(currentPassword, result.rows[0].password)) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE ${account.table} SET password = $1 WHERE ${account.idColumn} = $2`,
      [passwordHash, req.user.id]
    );
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Password change failed:', error.message);
    res.status(500).json({ message: 'Unable to change password.' });
  }
};
