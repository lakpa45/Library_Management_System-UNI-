import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const MAX = 35 * 1024 * 1024;
const marker = `upload-limit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const token = jwt.sign({ id: 0, email: 'upload-test@example.test', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '10m' });
const headers = { Authorization: `Bearer ${token}` };
const createdBookIds = [];
let categoryId;

const uploadDirectories = [
    path.resolve('public/images/books'),
    path.resolve('public/pdfs/books')
];
const listUploads = () => new Set(uploadDirectories.flatMap(directory => fs.existsSync(directory)
    ? fs.readdirSync(directory).map(name => path.join(directory, name)) : []));
const baselineFiles = listUploads();

function pdfBytes(size) {
    const bytes = new Uint8Array(size);
    bytes.set(Buffer.from('%PDF-1.4\n'));
    return bytes;
}

function jpegBytes() {
    return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
}

async function upload(name, { file, filename, type, field = 'book_pdf', category = categoryId } = {}) {
    const form = new FormData();
    form.set('title', `${marker}-${name}`);
    form.set('description', 'Temporary upload boundary test');
    form.set('isbn', `UT-${crypto.createHash('sha1').update(`${marker}-${name}`).digest('hex').slice(0, 16)}`);
    form.set('copies', '1');
    form.set('category_id', String(category));
    form.set('book_type', field === 'book_pdf' ? 'digital' : 'physical');
    if (file) form.set(field, new Blob([file], { type }), filename);
    const response = await fetch(`${base}/api/books`, { method: 'POST', headers, body: form });
    const body = await response.json();
    if (body.book_id) createdBookIds.push(body.book_id);
    return { response, body };
}

function check(name, condition, detail = '') {
    if (!condition) throw new Error(`${name} failed${detail ? `: ${detail}` : ''}`);
    console.log(`PASS ${name}`);
}

try {
    categoryId = (await pool.query(
        'INSERT INTO category (category_name, description) VALUES ($1, $2) RETURNING category_id',
        [marker, 'Temporary upload test category']
    )).rows[0].category_id;

    let result = await upload('small-pdf', { file: pdfBytes(1024), filename: 'small.pdf', type: 'application/pdf' });
    check('valid PDF below 35 MB', result.response.status === 201, JSON.stringify(result.body));

    result = await upload('exact-pdf', { file: pdfBytes(MAX), filename: 'exact.pdf', type: 'application/pdf' });
    check('PDF exactly 35 MB', result.response.status === 201, `${result.response.status} ${JSON.stringify(result.body)}`);

    result = await upload('oversize-pdf', { file: pdfBytes(MAX + 1), filename: 'oversize.pdf', type: 'application/pdf' });
    check('PDF over 35 MB returns 413', result.response.status === 413 && result.body.success === false && result.body.message === 'File size must not exceed 35 MB.', `${result.response.status} ${JSON.stringify(result.body)}`);

    result = await upload('unsupported', { file: new Uint8Array([1, 2, 3]), filename: 'notes.txt', type: 'text/plain' });
    check('unsupported type rejected', result.response.status === 400 && result.body.success === false, `${result.response.status} ${JSON.stringify(result.body)}`);

    result = await upload('valid-cover', { file: jpegBytes(), filename: 'cover.jpg', type: 'image/jpeg', field: 'cover_image' });
    check('valid cover image', result.response.status === 201, JSON.stringify(result.body));

    result = await upload('missing-file');
    check('missing optional file', result.response.status === 201, JSON.stringify(result.body));

    result = await upload('rollback-file', { file: pdfBytes(1024), filename: 'rollback.pdf', type: 'application/pdf', category: 2147483647 });
    check('failed upload request rejected', result.response.status === 400);
} finally {
    if (createdBookIds.length) {
        await pool.query('DELETE FROM book_copy WHERE book_id = ANY($1::int[])', [createdBookIds]);
        await pool.query('DELETE FROM book WHERE book_id = ANY($1::int[])', [createdBookIds]);
    }
    if (categoryId) await pool.query('DELETE FROM category WHERE category_id = $1', [categoryId]);
    for (const file of listUploads()) {
        if (!baselineFiles.has(file)) await fs.promises.unlink(file).catch(() => {});
    }
    const leftovers = [...listUploads()].filter(file => !baselineFiles.has(file));
    check('upload failures leave no temporary files', leftovers.length === 0, leftovers.join(', '));
    await pool.end();
}
