CREATE UNIQUE INDEX IF NOT EXISTS member_email_lower_unique
ON member (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS admins_email_lower_unique
ON admins (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS librarian_email_lower_unique
ON librarian (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS category_name_lower_unique
ON category (LOWER(category_name));
