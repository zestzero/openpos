-- Drop indexes first (in reverse order of creation)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_inventory_ledger_created_at;
DROP INDEX IF EXISTS idx_inventory_ledger_variant;
DROP INDEX IF EXISTS idx_variants_barcode;
DROP INDEX IF EXISTS idx_variants_sku;
DROP INDEX IF EXISTS idx_variants_product;
DROP INDEX IF EXISTS idx_products_category;

-- Drop tables in reverse order
DROP TABLE IF EXISTS inventory_ledger;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";