-- Add payment tracking fields to orders table

ALTER TABLE orders
ADD COLUMN payment_method VARCHAR(10) CHECK (payment_method IN ('cash', 'qr')),
ADD COLUMN tendered_cents INTEGER,
ADD COLUMN change_cents INTEGER,
ADD COLUMN receipt_printed BOOLEAN NOT NULL DEFAULT false;

-- Add indexes for querying unpaid orders
CREATE INDEX idx_orders_payment_method ON orders(payment_method) WHERE payment_method IS NOT NULL;
