import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import pool from '../db/connection.js';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const marker = `codex-test-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const email = `${marker}@example.test`;
const password = 'TestPass!234';
const created = { memberId: null, categoryId: null, bookId: null, resetId: null, files: [] };
const results = [];

function check(name, condition, detail = '') {
  if (!condition) throw new Error(`${name} failed${detail ? `: ${detail}` : ''}`);
  results.push(name);
}

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
}

try {
  let result = await request('/api/auth/librarian/signin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'missing@example.test', password: 'wrong-password', role: 'admin' })
  });
  check('invalid admin sign-in rejected', result.response.status === 401);
  result = await request('/api/auth/librarian-staff/signin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'missing@example.test', password: 'wrong-password', role: 'librarian' })
  });
  check('invalid librarian sign-in rejected', result.response.status === 401);

  result = await request('/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: 'Codex', last_name: 'Test', email, phone: '9876543210', department: 'Testing', password, role: 'admin' })
  });
  check('registration without member type', result.response.status === 201, JSON.stringify(result.body));
  check('tampered role ignored in response', result.body.member.role === 'member', JSON.stringify(result.body));
  check('password not returned', !JSON.stringify(result.body).includes(password));
  created.memberId = result.body.member.member_id;

  const member = (await pool.query('SELECT password, status, role, member_type, card_no FROM member WHERE member_id = $1', [created.memberId])).rows[0];
  check('password hashed', member.password !== password && await bcrypt.compare(password, member.password));
  check('registration uses pending default', member.status === 'Pending', member.status);
  check('tampered role saved as member', member.role === 'member', member.role);
  check('homepage registration uses default member type', member.member_type === 'Student', member.member_type);

  result = await request('/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: 'Codex', last_name: 'Test', email, phone: '9876543210', member_type: 'Student', department: 'Testing', password })
  });
  check('duplicate registration', result.response.status === 409);

  result = await request('/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bad' })
  });
  check('invalid registration rejected', result.response.status === 400);

  await pool.query("UPDATE member SET status = 'Approved' WHERE member_id = $1", [created.memberId]);
  result = await request('/api/auth/signin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toUpperCase(), password, role: 'member' })
  });
  check('member sign-in', result.response.status === 200);
  check('member auth cookie', (result.response.headers.get('set-cookie') || '').includes('userSession='));
  const memberToken = result.body.token;
  const memberHeaders = { Authorization: `Bearer ${memberToken}` };
  check('member token uses renamed role', jwt.decode(memberToken)?.role === 'member');
  const legacyMemberToken = jwt.sign(
    { id: created.memberId, email, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
  result = await request('/api/wishlist', {
    headers: { Authorization: `Bearer ${legacyMemberToken}` }
  });
  check('existing user-role token can open My Books', result.response.status === 200, JSON.stringify(result.body));
  result = await request('/api/members/me', { headers: memberHeaders });
  check('dashboard profile returns existing Card ID', result.response.status === 200 && result.body.card_no === member.card_no);

  result = await request('/api/auth/change-password', {
    method: 'POST', headers: { ...memberHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: password, newPassword: 'Updated!234' })
  });
  check('authenticated password change', result.response.status === 200);

  result = await request('/api/categories', { method: 'POST', headers: { ...memberHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  check('member denied category mutation', result.response.status === 403);

  const adminToken = jwt.sign({ id: 0, email: 'smoke@example.test', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  result = await request(`/api/loans/members/search?q=${encodeURIComponent(member.card_no)}`, { headers: adminHeaders });
  check('member exact unique-ID search', result.response.status === 200 && result.body.valid === true && result.body.member.member_id === created.memberId);
  result = await request(`/api/loans/members/search?q=${encodeURIComponent(email.toUpperCase())}`, { headers: adminHeaders });
  check('member exact username search', result.response.status === 200 && result.body.valid === true && result.body.member.member_id === created.memberId);
  result = await request(`/api/loans/members/search?q=${encodeURIComponent(`  ${email}  `)}`, { headers: adminHeaders });
  check('member verification trims spaces', result.response.status === 200 && result.body.member.member_id === created.memberId);
  check('member verification returns safe fields', !['password', 'reset_token', 'reset_token_expiry'].some(key => key in result.body.member));
  result = await request('/api/loans/members/search?q=definitely-missing-member', { headers: adminHeaders });
  check('missing member search', result.response.status === 404);
  result = await request('/api/loans/members/search?q=', { headers: adminHeaders });
  check('empty member verification rejected', result.response.status === 400);
  result = await request('/api/loans/issue', { method: 'POST', headers: { ...memberHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  check('member denied librarian borrow endpoint', result.response.status === 403);
  result = await request('/api/loans/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  check('unauthenticated borrow rejected', result.response.status === 401);
  result = await request('/api/loans/return/1', { method: 'PUT', headers: { ...memberHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  check('member denied librarian return endpoint', result.response.status === 403);
  result = await request('/api/categories', {
    method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_name: marker, description: 'Temporary smoke-test category', color: '#1B4332' })
  });
  check('category create', result.response.status === 201, JSON.stringify(result.body));
  created.categoryId = result.body.category_id;

  const invalidUpload = new FormData();
  invalidUpload.set('title', `${marker}-invalid-upload`); invalidUpload.set('category_id', String(created.categoryId)); invalidUpload.set('copies', '1');
  invalidUpload.set('cover_image', new Blob(['not an image'], { type: 'image/jpeg' }), 'fake.jpg');
  result = await request('/api/books', { method: 'POST', headers: adminHeaders, body: invalidUpload });
  check('invalid upload signature rejected', result.response.status === 400 && result.body.message);

  result = await request(`/api/categories/${created.categoryId}`, {
    method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_name: `${marker}-updated`, description: 'Updated', color: '#123456' })
  });
  check('category update', result.response.status === 200);

  const form = new FormData();
  form.set('title', marker); form.set('isbn', `T-${Date.now()}`); form.set('description', 'Temporary smoke-test book');
  form.set('book_type', 'physical');
  form.set('category_id', String(created.categoryId)); form.set('copies', '2');
  form.set('cover_image', new Blob([fs.readFileSync('public/images/1stbook.jpg')], { type: 'image/jpeg' }), 'smoke-cover.jpg');
  form.set('book_pdf', new Blob([fs.readFileSync('public/pdfs/books/1787803122021-Full.pdf')], { type: 'application/pdf' }), 'smoke-book.pdf');
  result = await request('/api/books', { method: 'POST', headers: adminHeaders, body: form });
  check('book create', result.response.status === 201, JSON.stringify(result.body));
  created.bookId = result.body.book_id;
  created.files.push(result.body.cover_image, result.body.pdf_file);
  check('cover and PDF upload', created.files.every(file => file && fs.existsSync(path.join('public', file))));
  const copies = await pool.query('SELECT COUNT(*)::int count FROM book_copy WHERE book_id = $1', [created.bookId]);
  check('physical copies created', copies.rows[0].count === 2, copies.rows[0].count);
  await pool.query("UPDATE book SET book_type = 'physical' WHERE book_id = $1", [created.bookId]);

  result = await request(`/api/loans/books/search?q=${created.bookId}`, { headers: adminHeaders });
  check('available physical book search by ID', result.response.status === 200 && result.body.some(book => book.book_id === created.bookId && book.available_quantity === 2));
  const issueDate = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  result = await request('/api/loans/issue', { method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: 'invalid', book_id: created.bookId, issue_date: issueDate, due_date: dueDate }) });
  check('invalid borrow identifiers rejected', result.response.status === 400);
  const concurrentBorrowOptions = { method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: created.memberId, book_id: created.bookId, issue_date: issueDate, due_date: dueDate }) };
  const concurrentResults = await Promise.all([
    request('/api/loans/issue', concurrentBorrowOptions),
    request('/api/loans/issue', concurrentBorrowOptions)
  ]);
  const successfulBorrow = concurrentResults.find(item => item.response.status === 201);
  check('concurrent double-click creates one borrowing', concurrentResults.filter(item => item.response.status === 201).length === 1 && concurrentResults.filter(item => item.response.status === 409).length === 1, concurrentResults.map(item => item.response.status).join(','));
  check('librarian borrow success message', successfulBorrow?.body.message === 'Book borrowed successfully.', JSON.stringify(successfulBorrow?.body));
  const librarianIssueId = successfulBorrow.body.borrowing.issue_id;
  const afterBorrow = await pool.query("SELECT COUNT(*)::int available FROM book_copy WHERE book_id = $1 AND LOWER(status) = 'available'", [created.bookId]);
  check('borrow record created and quantity decreased', afterBorrow.rows[0].available === 1);
  result = await request('/api/loans/issue', { method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: created.memberId, book_id: created.bookId, issue_date: issueDate, due_date: dueDate }) });
  check('duplicate active borrowing rejected', result.response.status === 409);
  result = await request('/api/loans/issue', { method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: created.memberId, book_id: 2147483647, issue_date: issueDate, due_date: dueDate }) });
  check('missing book rejected', result.response.status === 404);
  result = await request(`/api/loans/members/${created.memberId}/active`, { headers: adminHeaders });
  check('member active borrowings listed', result.response.status === 200 && result.body.some(loan => loan.issue_id === librarianIssueId));
  result = await request(`/api/loans/return/${librarianIssueId}`, { method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  check('librarian return', result.response.status === 200);
  const afterReturn = await pool.query("SELECT COUNT(*)::int available FROM book_copy WHERE book_id = $1 AND LOWER(status) = 'available'", [created.bookId]);
  check('return date saved and quantity increased', afterReturn.rows[0].available === 2);
  result = await request(`/api/loans/return/${librarianIssueId}`, { method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  check('same librarian borrowing cannot return twice', result.response.status === 404);
  await pool.query("UPDATE book_copy SET status = 'Issued' WHERE book_id = $1", [created.bookId]);
  result = await request('/api/loans/issue', { method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: created.memberId, book_id: created.bookId, issue_date: issueDate, due_date: dueDate }) });
  check('zero-availability book rejected', result.response.status === 409);
  await pool.query("UPDATE book_copy SET status = 'Available' WHERE book_id = $1", [created.bookId]);

  result = await request(`/api/wishlist/${created.bookId}`, { method: 'POST', headers: memberHeaders });
  check('wishlist add', result.response.status === 201);
  result = await request(`/api/wishlist/${created.bookId}`, { method: 'POST', headers: memberHeaders });
  check('wishlist duplicate rejected', result.response.status === 409);
  result = await request(`/api/wishlist/${created.bookId}/status`, { headers: memberHeaders });
  check('wishlist status survives detail refresh', result.response.status === 200 && result.body.wishlisted === true);
  result = await request('/api/wishlist', { headers: memberHeaders });
  check('wishlist isolation/read', result.response.status === 200 && result.body.some(book => book.book_id === created.bookId));
  result = await request(`/api/wishlist/${created.bookId}`, { method: 'DELETE', headers: memberHeaders });
  check('wishlist remove', result.response.status === 200 && result.body.wishlisted === false);
  result = await request(`/api/wishlist/${created.bookId}`, { method: 'DELETE', headers: memberHeaders });
  check('wishlist repeat remove rejected', result.response.status === 404);
  result = await request(`/api/wishlist/${created.bookId}/status`, { headers: memberHeaders });
  check('wishlist status reflects removal', result.response.status === 200 && result.body.wishlisted === false);

  result = await request('/api/loans/borrow', {
    method: 'POST', headers: { ...memberHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ book_id: created.bookId })
  });
  check('member borrow', result.response.status === 201, JSON.stringify(result.body));
  const issueId = result.body.issue_id;
  result = await request(`/api/loans/return/${issueId}`, {
    method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: '{}'
  });
  check('admin return', result.response.status === 200);
  result = await request(`/api/loans/return/${issueId}`, {
    method: 'PUT', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: '{}'
  });
  check('duplicate return rejected', result.response.status === 404);

  const resetToken = crypto.randomBytes(32).toString('hex');
  const reset = await pool.query(
    "INSERT INTO password_reset (email, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes') RETURNING reset_id",
    [email, resetToken]
  );
  created.resetId = reset.rows[0].reset_id;
  result = await request('/api/auth/reset-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, newPassword: 'Changed!234' })
  });
  check('password reset', result.response.status === 200);
  result = await request('/api/auth/reset-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, newPassword: 'Changed!234' })
  });
  check('used reset token rejected', result.response.status === 400);

  console.log(`Passed ${results.length} smoke tests:`);
  results.forEach(name => console.log(`- ${name}`));
} finally {
  if (created.memberId) await pool.query('DELETE FROM wishlist WHERE member_id = $1', [created.memberId]);
  if (created.memberId) await pool.query('DELETE FROM issue WHERE member_id = $1', [created.memberId]);
  if (created.bookId) await pool.query('DELETE FROM book_copy WHERE book_id = $1', [created.bookId]);
  if (created.bookId) await pool.query('DELETE FROM book WHERE book_id = $1', [created.bookId]);
  if (created.resetId) await pool.query('DELETE FROM password_reset WHERE reset_id = $1', [created.resetId]);
  if (created.memberId) await pool.query('DELETE FROM member WHERE member_id = $1', [created.memberId]);
  if (created.categoryId) await pool.query('DELETE FROM category WHERE category_id = $1', [created.categoryId]);
  for (const file of created.files) {
    const target = path.resolve('public', `.${file}`);
    const publicRoot = `${path.resolve('public')}${path.sep}`;
    if (target.startsWith(publicRoot)) await fs.promises.unlink(target).catch(() => {});
  }
  await pool.end();
}
