import pool from '../db/connection.js';

export const findMemberByEmail = async (email) => {
    const result = await pool.query(
        'SELECT * FROM member WHERE email = $1',
        [email]
    );
    return result.rows[0];
};

export const findMemberById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM member WHERE member_id = $1',
        [id]
    );
    return result.rows[0];
};

export const createMember = async ({ first_name, last_name, email, password, phone }) => {
    const result = await pool.query(
        `INSERT INTO member (first_name, last_name, email, password, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING member_id, first_name, last_name, email, phone`,
        [first_name, last_name, email, password, phone]
    );
    return result.rows[0];
};