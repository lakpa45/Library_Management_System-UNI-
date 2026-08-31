ALTER TABLE book
ADD COLUMN IF NOT EXISTS book_type VARCHAR(10) NOT NULL DEFAULT 'physical';

UPDATE book
SET book_type = 'physical'
WHERE book_type IS NULL OR LOWER(book_type) NOT IN ('physical', 'digital');

ALTER TABLE book
DROP CONSTRAINT IF EXISTS book_type_valid;

ALTER TABLE book
ADD CONSTRAINT book_type_valid CHECK (LOWER(book_type) IN ('physical', 'digital'));

CREATE INDEX IF NOT EXISTS book_type_idx ON book (LOWER(book_type));
