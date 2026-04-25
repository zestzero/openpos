-- Remove pin_hash column
ALTER TABLE users DROP COLUMN IF EXISTS pin_hash;