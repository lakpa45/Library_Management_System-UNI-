UPDATE book
SET book_type = 'digital'
WHERE pdf_file IS NOT NULL
  AND BTRIM(pdf_file) <> ''
  AND LOWER(book_type) <> 'digital';
