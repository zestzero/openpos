-- Add is_active flag for user management
ALTER TABLE users
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to active
UPDATE users SET is_active = true WHERE is_active IS NULL;
