-- name: CreateCategory :one
INSERT INTO categories (name, description, parent_id)
VALUES ($1, $2, $3)
RETURNING id, name, description, parent_id, created_at, updated_at;

-- name: GetCategory :one
SELECT id, name, description, parent_id, created_at, updated_at
FROM categories
WHERE id = $1;

-- name: ListCategories :many
SELECT id, name, description, parent_id, created_at, updated_at
FROM categories
ORDER BY name;

-- name: UpdateCategory :one
UPDATE categories
SET name = $2, description = $3, parent_id = $4, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, name, description, parent_id, created_at, updated_at;

-- name: CreateProduct :one
INSERT INTO products (name, description, category_id, image_url, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, description, category_id, image_url, is_active, created_at, updated_at;

-- name: GetProduct :one
SELECT id, name, description, category_id, image_url, is_active, created_at, updated_at
FROM products
WHERE id = $1;

-- name: GetProductWithCategory :one
SELECT p.id, p.name, p.description, p.category_id, p.image_url, p.is_active, p.created_at, p.updated_at,
       c.id as category_id, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.id = $1;

-- name: ListProducts :many
SELECT p.id, p.name, p.description, p.category_id, p.image_url, p.is_active, p.created_at, p.updated_at
FROM products p
WHERE ($1::uuid IS NULL OR p.category_id = $1)
  AND ($2::boolean IS NULL OR p.is_active = $2)
ORDER BY p.name;

-- name: ListProductsByCategory :many
SELECT id, name, description, category_id, image_url, is_active, created_at, updated_at
FROM products
WHERE category_id = $1
ORDER BY name;

-- name: UpdateProduct :one
UPDATE products
SET name = $2, description = $3, category_id = $4, image_url = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, name, description, category_id, image_url, is_active, created_at, updated_at;

-- name: CreateVariant :one
INSERT INTO variants (product_id, sku, barcode, name, price, cost, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at;

-- name: GetVariant :one
SELECT id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at
FROM variants
WHERE id = $1;

-- name: GetVariantBySKU :one
SELECT id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at
FROM variants
WHERE sku = $1;

-- name: GetVariantByBarcode :one
SELECT id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at
FROM variants
WHERE barcode = $1;

-- name: ListVariantsByProduct :many
SELECT id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at
FROM variants
WHERE product_id = $1
ORDER BY name;

-- name: SearchVariant :one
SELECT v.id, v.product_id, v.sku, v.barcode, v.name, v.price, v.cost, v.is_active, v.created_at, v.updated_at,
       p.name as product_name
FROM variants v
JOIN products p ON v.product_id = p.id
WHERE v.barcode = $1 OR v.sku = $1;

-- name: UpdateVariant :one
UPDATE variants
SET sku = $2, barcode = $3, name = $4, price = $5, cost = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at;

-- name: GetProductWithVariants :one
SELECT p.id, p.name, p.description, p.category_id, p.image_url, p.is_active, p.created_at, p.updated_at,
       c.id as category_id, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.id = $1;

-- name: ListVariantsByProductID :many
SELECT id, product_id, sku, barcode, name, price, cost, is_active, created_at, updated_at
FROM variants
WHERE product_id = $1
ORDER BY name;

-- name: CheckSKUExists :one
SELECT EXISTS(SELECT 1 FROM variants WHERE sku = $1 AND ($2::uuid IS NULL OR id != $2)) as exists;

-- name: CheckBarcodeExists :one
SELECT EXISTS(SELECT 1 FROM variants WHERE barcode = $1 AND barcode IS NOT NULL AND ($2::uuid IS NULL OR id != $2)) as exists;