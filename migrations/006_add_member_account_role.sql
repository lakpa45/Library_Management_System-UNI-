ALTER TABLE member
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';

UPDATE member
SET role = 'member'
WHERE role IS DISTINCT FROM 'member';

ALTER TABLE member
    DROP CONSTRAINT IF EXISTS member_role_check;

ALTER TABLE member
    ADD CONSTRAINT member_role_check CHECK (role = 'member');
