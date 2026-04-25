-- name: CreateUser :one
INSERT INTO users (email, password_hash, role, name)
VALUES ($1, $2, $3, $4)
RETURNING id, email, role, name, created_at, updated_at;

-- name: GetUserByEmail :one
SELECT id, email, password_hash, role, name, created_at, updated_at
FROM users
WHERE email = $1;

-- name: GetUserByPIN :one
SELECT id, email, password_hash, role, name, created_at, updated_at
FROM users
WHERE email = $1 AND pin_hash = $2;

-- name: GetUserByID :one
SELECT id, email, password_hash, role, name, created_at, updated_at
FROM users
WHERE id = $1;

-- name: ListCashiers :many
SELECT id, email, role, name, created_at, updated_at
FROM users
WHERE role = 'cashier'
ORDER BY created_at DESC;

-- name: UpdateUserPin :one
UPDATE users
SET pin_hash = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, email, role, name, updated_at;