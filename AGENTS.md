# AGENTS.md

Coding conventions and guidelines for AI agents working on OpenPOS.

## Stack

- **Backend**: Go 1.22+ with chi v5 router, sqlc for SQL→Go codegen, pgx v5 for PostgreSQL
- **Frontend**: Vite + React 18/19, TanStack Query, TanStack Router, Tailwind CSS v4, shadcn/ui
- **Database**: PostgreSQL 15+, golang-migrate for schema migrations
- **Offline**: Dexie.js (IndexedDB), hand-written service worker
- **Deployment**: Docker multi-stage build

## Backend Conventions

### Project Layout

```
cmd/server/main.go           # Entry point
internal/{domain}/handler.go  # HTTP handlers (chi)
internal/{domain}/service.go  # Business logic
db/migrations/*.sql           # Schema migrations
db/queries/{domain}.sql       # sqlc query files
db/sqlc/                      # Generated code (do NOT edit)
```

### Go Style

- Follow standard Go conventions (`gofmt`, `go vet`)
- Use `internal/` for all application code — nothing exported outside the module
- Error handling: return errors, don't panic. Wrap with `fmt.Errorf("doing X: %w", err)`
- Context: pass `context.Context` as first parameter to all service and DB functions
- Naming: `camelCase` for unexported, `PascalCase` for exported. Package names are lowercase, singular

### sqlc Queries

- Write SQL in `db/queries/{domain}.sql`
- Use sqlc annotations: `-- name: FunctionName :one`, `:many`, `:exec`, `:execresult`
- After adding/changing queries: run `sqlc generate`
- Never edit files in `db/sqlc/` — they are generated

### Database Migrations

- Create new migrations with: `migrate create -ext sql -dir db/migrations -seq {name}`
- Always create both `.up.sql` and `.down.sql`
- Migrations are forward-only in production
- All monetary values stored as `BIGINT` (cents/satang) or `NUMERIC(12,2)`

### HTTP Handlers

- Use chi router groups and middleware
- JSON request/response with `encoding/json`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error
- Auth via JWT in `Authorization: Bearer <token>` header

### Inter-Domain Communication

- Direct function calls between domain services (same process)
- No HTTP or message queues between internal packages
- Inject dependencies via constructor: `NewSalesService(queries, inventoryService)`

## Frontend Conventions

### Project Layout

```
frontend/src/
├── api/          # API client functions
├── components/   # Shared UI components
├── pos/          # POS-specific pages and components
├── erp/          # ERP-specific pages and components
├── hooks/        # Custom React hooks
├── lib/          # Utilities (formatting, constants)
└── routes/       # TanStack Router route definitions
```

### React Style

- Functional components only
- TanStack Query for all server state (no manual fetch + useState)
- TanStack Router for routing (file-based)
- shadcn/ui for UI components (do not import from @radix-ui directly)
- Tailwind CSS v4 (`@theme` in CSS, not JS config)

### TypeScript

- Strict mode enabled
- Define API response types matching Go API contracts
- Use `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })` for all monetary display
- Store amounts as integers (satang) in frontend too

### Offline / PWA

- Dexie.js for IndexedDB (products, orders, sync queue)
- Client-generated UUIDs for offline-created orders
- Delta sync: sync operations (`decrement 1`), not state (`set to 9`)
- Service worker: cache-first for static assets, network-first for API calls

## Data Model Rules

1. **Never flat products** — always Product (parent) → Variant (child)
2. **Never quantity column** — always inventory ledger with derived snapshot
3. **Delta sync only** — offline sync sends operations, not absolute values
4. **Monetary values as integers** — store in cents/satang, format on display

## Testing

- Go: `go test ./...` with table-driven tests
- Frontend: Vitest for unit tests
- API: httptest package for handler tests in Go

## Git

- Atomic commits per logical change
- Commit messages: imperative mood, concise ("add auth middleware", "fix stock deduction race condition")
- Keep temporary files and scratch artifacts inside the repository workspace; do not write them outside the repo unless there is a concrete, unavoidable reason.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### Why Use the Code-Review-Graph

The codebase has both frontend and backend components with complex interdependencies:

- **Frontend**: React components, hooks, routes, API clients, service workers
- **Backend**: Go services, handlers, database queries, migrations
- **Offline**: IndexedDB syncing, delta operations, service workers

Blindly exploring with `grep` or `glob` leads to:

1. **Token waste**: Reading entire files when you only need a function signature
2. **Missed context**: Manual scanning misses indirect dependencies (e.g., a handler that calls a service)
3. **Incomplete impact analysis**: You might fix a bug in one place but miss 5 other call sites
4. **Broken tests**: Changes that look local can affect distant tests you didn't know existed
5. **Architecture blindness**: No visibility into which code communities are tightly coupled

The graph solves all of this by pre-computing:

- **Call graphs**: Who calls what, and in what order (flows)
- **Import chains**: Dependency relationships across files and packages
- **Test coverage**: Which tests exercise which code (critical for ensuring changes don't break things)
- **Communities**: Logical groupings of related code (helps you understand architecture)
- **Hotspots**: Hub nodes with high connectivity (changes here have wide blast radius)
- **Bridge nodes**: Code that sits between communities (critical for stability)

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
  - Example: Looking for where authentication is handled? Search for "auth" nodes instead of grepping
  - Much faster and returns structured relationships, not just raw text matches
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
  - Example: You changed a service function. How many call sites are affected? The graph tells you immediately
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
  - Example: A PR changes 5 files. Instead of reading all 5, the graph shows what actually changed and what depends on it
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
  - Example: Finding who calls a function? Don't manually search — use callers_of
- **Architecture questions**: `get_architecture_overview` + `list_communities`
  - Example: "How is the auth flow structured?" The graph shows the full execution path with call chains
- **Refactoring**: `refactor_tool` mode="rename" or mode="dead_code"
  - Example: Renaming a function? Preview shows every location that needs updating
- **Debugging**: `traverse_graph` to understand code flow around an error
  - Example: "This API call fails, what calls it and what does it call?" Traverse the graph to see the context

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need (e.g., searching raw text patterns).

### Key Tools

| Tool | Use when | Example |
|------|----------|---------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis | PR review: what changed and what's the blast radius? |
| `get_review_context` | Need source snippets for review — token-efficient | Showing snippets alongside impact analysis |
| `get_impact_radius` | Understanding blast radius of a change | Changing inventory ledger logic → what calls this? |
| `get_affected_flows` | Finding which execution paths are impacted | Changed product service → which user flows break? |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies | Find all tests for a handler, all handlers in a service |
| `semantic_search_nodes` | Finding functions/classes by name or keyword | Search "sync" to find offline sync logic |
| `get_architecture_overview` | Understanding high-level codebase structure | Visualize frontend vs backend structure |
| `list_communities` | Finding logical code groupings | Which files belong together? |
| `get_hub_nodes_tool` | Finding architectural hotspots | Which functions have the most dependencies? |
| `get_bridge_nodes_tool` | Finding code that connects communities | Which functions sit between frontend/backend? |
| `refactor_tool` (rename) | Planning renames with full-codebase awareness | Rename function, preview all locations that need updating |
| `refactor_tool` (dead_code) | Finding unused functions and classes | What code can safely be deleted? |
| `traverse_graph` | Free-form exploration from a starting point | "Start from this error handler, what does it call?" |

### Workflow Patterns

#### Pattern 1: Code Review
1. Run `detect_changes` to see what changed and impact score
2. Run `get_review_context` to get risk-scored review guidance
3. Use `get_affected_flows` to see which user flows are impacted
4. Use `query_graph` pattern="tests_for" to verify test coverage

#### Pattern 2: Understanding a Feature
1. Use `semantic_search_nodes` to find main entry point (e.g., handler or component)
2. Use `query_graph` pattern="callees_of" to see what it calls
3. Use `get_flow_tool` to understand the full execution path
4. Use `get_affected_flows` to see which other features depend on this code

#### Pattern 3: Debugging a Bug
1. Use `semantic_search_nodes` to find the buggy function
2. Use `query_graph` pattern="callers_of" to see who calls it
3. Use `query_graph` pattern="tests_for" to see tests that exercise it
4. Use `traverse_graph` with the bug location to understand context

#### Pattern 4: Making a Safe Change
1. Run `get_impact_radius` to see direct and indirect impacts
2. Use `query_graph` pattern="tests_for" to ensure you have test coverage
3. Run `detect_changes` to get a risk assessment before committing
4. Use `refactor_tool` mode="rename" if renaming code

#### Pattern 5: Architectural Questions
1. Run `get_architecture_overview` to see community structure
2. Use `list_communities` to find related code groups
3. Use `get_surprising_connections_tool` to find unexpected cross-community coupling
4. Use `get_bridge_nodes_tool` to find critical connection points

### Graph Maintenance

The graph auto-updates on file changes. But if you need to manually refresh:

```bash
# Rebuild the entire graph (slower, but catches everything)
code-review-graph build --full

# Incremental update (faster, only changed files)
code-review-graph build --incremental
```

For large repos, use the MCP tools which handle updates automatically.
