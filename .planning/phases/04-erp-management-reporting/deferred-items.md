# Deferred Items — Phase 04-01

- `go test ./internal/sales ./...` fails in `internal/catalog` / `server` because repo-wide sqlc regeneration changed catalog query return types (`GetCategoryRow`, `ListCategoriesRow`, `CreateCategoryRow`) and `internal/catalog/service.go` still expects the older generated shapes.
- This is out of scope for the order-item cost snapshot task and should be handled in a catalog/sqlc follow-up plan.
