-- Add pin_hash column for cashier PIN login
ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255);