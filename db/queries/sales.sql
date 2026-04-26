-- name: CreateOrder :one
INSERT INTO orders (client_uuid, user_id, status, total_amount)
VALUES ($1, $2, $3, $4)
ON CONFLICT (client_uuid) DO NOTHING
RETURNING id, client_uuid, user_id, status, total_amount, created_at, updated_at;

-- name: CreateOrderItem :one
INSERT INTO order_items (order_id, variant_id, quantity, unit_price, subtotal, cost_at_sale)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, order_id, variant_id, quantity, unit_price, subtotal, cost_at_sale, created_at;

-- name: GetOrderByClientUUID :one
SELECT id, client_uuid, user_id, status, total_amount, created_at, updated_at
FROM orders
WHERE client_uuid = $1;

-- name: GetOrderByID :one
SELECT id, client_uuid, user_id, status, total_amount, created_at, updated_at
FROM orders
WHERE id = $1;

-- name: ListOrders :many
SELECT id, client_uuid, user_id, status, total_amount, created_at, updated_at
FROM orders
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListOrderItemsByOrderID :many
SELECT id, order_id, variant_id, quantity, unit_price, subtotal, cost_at_sale, created_at
FROM order_items
WHERE order_id = $1
ORDER BY created_at ASC;

-- name: CreatePayment :one
INSERT INTO payments (order_id, method, tendered_amount, change_due, paid_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING id, order_id, method, tendered_amount, change_due, paid_at, created_at;

-- name: GetPaymentByOrderID :one
SELECT id, order_id, method, tendered_amount, change_due, paid_at, created_at
FROM payments
WHERE order_id = $1;
