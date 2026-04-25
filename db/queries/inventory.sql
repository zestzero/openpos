-- name: CreateLedgerEntry :one
INSERT INTO inventory_ledger (variant_id, quantity_change, reason, reference_id, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, variant_id, quantity_change, reason, reference_id, created_at, created_by;

-- name: GetStockLevel :one
SELECT COALESCE(SUM(quantity_change), 0) as stock_level
FROM inventory_ledger
WHERE variant_id = $1;

-- name: ListLedgerEntries :many
SELECT id, variant_id, quantity_change, reason, reference_id, created_at, created_by
FROM inventory_ledger
WHERE variant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetLedgerEntry :one
SELECT id, variant_id, quantity_change, reason, reference_id, created_at, created_by
FROM inventory_ledger
WHERE id = $1;

-- name: GetStockLevelByVariants :many
SELECT variant_id, COALESCE(SUM(quantity_change), 0) as stock_level
FROM inventory_ledger
WHERE variant_id = ANY($1::uuid[])
GROUP BY variant_id;