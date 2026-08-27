CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES book(book_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT wishlist_member_book_unique UNIQUE (member_id, book_id)
);

CREATE INDEX IF NOT EXISTS wishlist_member_id_idx ON wishlist(member_id);
