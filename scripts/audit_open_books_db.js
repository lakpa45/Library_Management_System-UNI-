import pool from '../db/connection.js';

const tables = await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
);

for (const table of tables.rows.map(({ table_name }) => table_name)) {
  const columns = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  console.log(`TABLE ${table}`);
  console.table(columns.rows);
}

console.log('CONSTRAINTS');
console.table((await pool.query(
  `SELECT rel.relname AS table_name, con.conname,
          pg_get_constraintdef(con.oid) AS definition
   FROM pg_constraint con
   JOIN pg_class rel ON rel.oid = con.conrelid
   JOIN pg_namespace ns ON ns.oid = rel.relnamespace
   WHERE ns.nspname = 'public'
   ORDER BY rel.relname, con.conname`
)).rows);

console.log('REFERENTIAL INTEGRITY');
console.table((await pool.query(
  `SELECT
    (SELECT COUNT(*) FROM book b LEFT JOIN category c ON c.category_id = b.category_id WHERE b.category_id IS NOT NULL AND c.category_id IS NULL)::int AS orphan_books,
    (SELECT COUNT(*) FROM book_copy bc LEFT JOIN book b ON b.book_id = bc.book_id WHERE b.book_id IS NULL)::int AS orphan_copies,
    (SELECT COUNT(*) FROM issue i LEFT JOIN member m ON m.member_id = i.member_id WHERE m.member_id IS NULL)::int AS orphan_issue_members,
    (SELECT COUNT(*) FROM issue i LEFT JOIN book_copy bc ON bc.copy_id = i.copy_id WHERE bc.copy_id IS NULL)::int AS orphan_issue_copies,
    (SELECT COUNT(*) FROM wishlist w LEFT JOIN member m ON m.member_id = w.member_id WHERE m.member_id IS NULL)::int AS orphan_wishlist_members,
    (SELECT COUNT(*) FROM wishlist w LEFT JOIN book b ON b.book_id = w.book_id WHERE b.book_id IS NULL)::int AS orphan_wishlist_books`
)).rows);

console.log('INDEXES');
console.table((await pool.query(
  `SELECT tablename, indexname, indexdef
   FROM pg_indexes WHERE schemaname = 'public'
   ORDER BY tablename, indexname`
)).rows);

console.log('ALL TABLES', tables.rows.map(({ table_name }) => table_name).join(', '));
console.log('CATEGORIES');
console.table((await pool.query(
  'SELECT category_id, category_name FROM category ORDER BY category_id'
)).rows);
console.log('BOOKS');
console.table((await pool.query(
  `SELECT b.book_id, b.title, b.isbn, b.category_id, c.category_name,
          b.cover_image, b.pdf_file
   FROM book b
   LEFT JOIN category c ON c.category_id = b.category_id
   ORDER BY b.book_id`
)).rows);

console.log('SMOKE TEST ARTIFACTS');
console.table((await pool.query(
  `SELECT
     (SELECT COUNT(*) FROM member WHERE email LIKE 'codex-test-%@example.test')::int AS members,
     (SELECT COUNT(*) FROM category WHERE category_name LIKE 'codex-test-%')::int AS categories,
     (SELECT COUNT(*) FROM book WHERE title LIKE 'codex-test-%')::int AS books`
)).rows);

await pool.end();
