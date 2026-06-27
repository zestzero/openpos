-- name: CreateLedgerEntry :one
INSERT INTO inventory_ledger (id, variant_id, quantity_change, reason, reference_id, created_by)
VALUES (COALESCE(NULLIF(sqlc.arg(id)::uuid, '00000000-0000-0000-0000-000000000000'::uuid), uuid_generate_v4()), sqlc.arg(variant_id), sqlc.arg(quantity_change), sqlc.arg(reason), sqlc.arg(reference_id), sqlc.arg(created_by))
ON CONFLICT (id) DO NOTHING
RETURNING id, variant_id, quantity_change, reason, reference_id, created_at, created_by;

-- name: GetStockLevel :one
SELECT COALESCE(SUM(quantity_change), 0)::BIGINT as stock_level
FROM inventory_ledger
WHERE variant_id = $1;

-- name: ListLedgerEntries :many
SELECT id, variant_id, quantity_change, reason, reference_id, created_at, created_by
FROM inventory_ledger
WHERE variant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetStockLevelByVariants :many
SELECT requested.variant_id::uuid AS variant_id, COALESCE(SUM(ledger.quantity_change), 0)::BIGINT as stock_level
FROM unnest($1::uuid[]) AS requested(variant_id)
LEFT JOIN inventory_ledger AS ledger ON ledger.variant_id = requested.variant_id
GROUP BY requested.variant_id;
