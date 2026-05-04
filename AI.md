# AI Notes

## Backend Start

From the repo root, start the backend with hot reload by running:

```bash
air
```

If `air` is installed with Go, make sure this is on your `PATH`:

```bash
export PATH="$(go env GOPATH)/bin:$PATH"
```

## Required Setup

Before starting the server, set the local env vars and prepare the database:

```bash
export DATABASE_URL="postgres://openpos:openpos@localhost:5432/openpos?sslmode=disable"
export JWT_SECRET="dev-secret-change-in-production"
export PORT="8080"

migrate -path db/migrations -database "$DATABASE_URL" up
sqlc generate
```

## Fallback

If hot reload is not needed, start the server directly with:

```bash
go run cmd/server/main.go
```
