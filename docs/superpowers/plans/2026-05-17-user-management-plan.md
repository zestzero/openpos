# User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user management settings page under Settings in the ERP, allowing owners to list, create, edit, and toggle active/inactive for all users.

**Architecture:** Backend exposes a `/api/users` CRUD router behind auth+owner middleware, reusing the existing `internal/auth` package. Frontend adds a Settings layout route at `/erp/settings` with a User Management child at `/erp/settings/users`. Settings becomes a parent nav item in the ERP sidebar.

**Tech Stack:** Go 1.26, chi v5, sqlc, pgx v5, React 19, TanStack Router/Query, Tailwind CSS v4

**Worktree:** `/Users/zestzero/Documents/work-dir/openpos-user-management` (branch `feat/user-management`)

---

### Task 1: Database Migration — Add `is_active` to Users

**Files:**
- Create: `db/migrations/012_add_user_active_flag.up.sql`
- Create: `db/migrations/012_add_user_active_flag.down.sql`

- [ ] **Step 1: Create the up migration**

`db/migrations/012_add_user_active_flag.up.sql`:
```sql
-- Add is_active flag for user management
ALTER TABLE users
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to active
UPDATE users SET is_active = true WHERE is_active IS NULL;
```

- [ ] **Step 2: Create the down migration**

`db/migrations/012_add_user_active_flag.down.sql`:
```sql
ALTER TABLE users
DROP COLUMN is_active;
```

- [ ] **Step 3: Commit**

```bash
git add db/migrations/012_add_user_active_flag.up.sql db/migrations/012_add_user_active_flag.down.sql
git commit -m "feat: add is_active column to users table"
```

---

### Task 2: Update sqlc Queries — Add User Management Queries

**Files:**
- Modify: `db/queries/auth.sql`

- [ ] **Step 1: Add new queries and update existing ones**

Append to `db/queries/auth.sql`:
```sql
-- name: ListUsers :many
SELECT id, email, role, name, is_active, created_at, updated_at
FROM users
ORDER BY created_at DESC;

-- name: UpdateUser :one
UPDATE users
SET email = $2, name = $3, role = $4, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, email, role, name, is_active, created_at, updated_at;

-- name: ToggleUserActive :one
UPDATE users
SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, email, role, name, is_active, created_at, updated_at;
```

Update the `CreateUser` query to return `is_active`:
```sql
-- name: CreateUser :one
INSERT INTO users (email, password_hash, role, name, pin_hash)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, email, role, name, is_active, created_at, updated_at;
```

- [ ] **Step 2: Commit**

```bash
git add db/queries/auth.sql
git commit -m "feat: add user management sqlc queries"
```

---

### Task 3: Regenerate sqlc

**Files:**
- Auto-generate: `db/sqlc/auth.sql.go` (do not edit by hand)
- Config: `sqlc.yaml`

- [ ] **Step 1: Run sqlc generate**

```bash
cd /Users/zestzero/Documents/work-dir/openpos-user-management && sqlc generate
```

- [ ] **Step 2: Commit**

```bash
git add db/sqlc/
git commit -m "chore: regenerate sqlc after user management queries"
```

---

### Task 4: Backend Service — Add User Management Methods

**Files:**
- Modify: `internal/auth/service.go`

- [ ] **Step 1: Add service methods**

Add to `internal/auth/service.go` after the `ListCashiers` method (around line 235):

```go
// ListUsers returns all users (owner only)
func (s *AuthService) ListUsers(ctx context.Context) ([]User, error) {
	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]User, len(users))
	for i, u := range users {
		result[i] = User{
			ID:    u.ID.String(),
			Email: u.Email,
			Role:  u.Role,
			Name:  u.Name,
		}
	}

	return result, nil
}

// UpdateUser updates a user's email, name, and role (owner only)
func (s *AuthService) UpdateUser(ctx context.Context, actorID, userID, email, name, role string) (*User, error) {
	// Parse UUIDs
	userUUID, err := parseUUID(userID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Prevent changing own role or deactivating self
	actorUUID, err := parseUUID(actorID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	if actorUUID == userUUID {
		return nil, errors.New("cannot change your own account from user management")
	}

	// Validate role
	if role != "owner" && role != "cashier" {
		return nil, errors.New("invalid role: must be 'owner' or 'cashier'")
	}

	user, err := s.queries.UpdateUser(ctx, sqlc.UpdateUserParams{
		ID:    userUUID,
		Email: email,
		Name:  name,
		Role:  role,
	})
	if err != nil {
		return nil, err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, nil
}

// ToggleUserActive toggles the is_active flag on a user (owner only)
func (s *AuthService) ToggleUserActive(ctx context.Context, actorID, userID string) (*User, error) {
	userUUID, err := parseUUID(userID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Prevent deactivating self
	actorUUID, err := parseUUID(actorID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	if actorUUID == userUUID {
		return nil, errors.New("cannot deactivate your own account")
	}

	user, err := s.queries.ToggleUserActive(ctx, userUUID)
	if err != nil {
		return nil, err
	}

	return &User{
		ID:    user.ID.String(),
		Email: user.Email,
		Role:  user.Role,
		Name:  user.Name,
	}, nil
}
```

- [ ] **Step 2: Add `"errors"` to the import list** if not already present (it is on line 6).

- [ ] **Step 3: Commit**

```bash
git add internal/auth/service.go
git commit -m "feat: add user management service methods"
```

---

### Task 5: Backend Handler — Add User Management Endpoints

**Files:**
- Modify: `internal/auth/handler.go`

- [ ] **Step 1: Add new request types and handler methods**

Add these types after the existing request types (around line 57):

```go
// UpdateUserRequest represents an update user request
type UpdateUserRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}
```

Add these handler methods after `ListCashiers` (around line 167):

```go
// ListUsers handles GET /api/users (owner only)
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.ListUsers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// UpdateUser handles PUT /api/users/{id} (owner only)
func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	actorID := r.Context().Value("user_id")
	if actorID == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.service.UpdateUser(r.Context(), actorID.(string), userID, req.Email, req.Name, req.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// ToggleUserActive handles PATCH /api/users/{id}/toggle-active (owner only)
func (h *Handler) ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	actorID := r.Context().Value("user_id")
	if actorID == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	user, err := h.service.ToggleUserActive(r.Context(), actorID.(string), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
```

- [ ] **Step 2: Add import for chi**

Update the import block in `handler.go` to include `"github.com/go-chi/chi/v5"` (it's already imported on line 7).

- [ ] **Step 3: Add a new UsersRouter method**

Add after the existing `Router()` method:

```go
// UsersRouter returns the chi router for user management endpoints (owner-only)
func (h *Handler) UsersRouter() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/", h.ListUsers)
	r.Put("/{id}", h.UpdateUser)
	r.Patch("/{id}/toggle-active", h.ToggleUserActive)

	return r
}
```

- [ ] **Step 4: Commit**

```bash
git add internal/auth/handler.go
git commit -m "feat: add user management handler endpoints"
```

---

### Task 6: Wire New Users Router in Bootstrap

**Files:**
- Modify: `cmd/server/bootstrap.go`

- [ ] **Step 1: Add "github.com/go-chi/chi/v5" to imports** (check if already imported — if not, add it).

- [ ] **Step 2: Add user management routes under the protected router**

Add after the reports mount (around line 106):

```go
// User management routes (owner-only, requires auth middleware)
usersRouter := authHandler.UsersRouter()
protected.Group(func(r chi.Router) {
	r.Use(appmiddleware.RequireRole("owner"))
	r.Mount("/users", usersRouter)
})
```

- [ ] **Step 3: Verify the full protected router section looks like:**

```go
	protected := chi.NewRouter()
	protected.Use(appmiddleware.AuthMiddleware(&appmiddleware.AuthConfig{JWTSecret: authConfig.JWTSecret}))

	catalogService := catalog.NewService(pool)
	catalogHandler := catalog.NewHandler(catalogService)
	protected.Mount("/catalog", catalogHandler.Routes())

	inventoryService := inventory.NewService(pool)
	inventoryHandler := inventory.NewHandler(inventoryService)
	protected.Mount("/inventory", inventoryHandler.Routes())

	salesService := sales.NewService(sales.NewOrderStore(sqlc.New(pool)), sales.NewInventoryGateway(inventoryService))
	salesHandler := sales.NewHandler(salesService)
	mountSalesRoutes(protected, pool, salesService, salesHandler.Routes())

	reportingService := reporting.NewService(sqlc.New(pool))
	reportingHandler := reporting.NewHandler(reportingService)
	protected.Mount("/reports", reportingHandler.Routes())

	// User management routes (owner-only, requires auth middleware)
	usersRouter := authHandler.UsersRouter()
	protected.Group(func(r chi.Router) {
		r.Use(appmiddleware.RequireRole("owner"))
		r.Mount("/users", usersRouter)
	})

	r.Mount("/api", protected)
```

- [ ] **Step 4: Commit**

```bash
git add cmd/server/bootstrap.go
git commit -m "feat: wire user management routes behind owner middleware"
```

---

### Task 7: Frontend — API Client and TanStack Query Hooks

**Files:**
- Create: `frontend/src/lib/users-api.ts`

- [ ] **Step 1: Create the users API client**

`frontend/src/lib/users-api.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getToken } from '@/lib/auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: 'owner' | 'cashier'
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateUserValues {
  email: string
  password: string
  name: string
  role: 'owner' | 'cashier'
  pin?: string
}

export interface UpdateUserValues {
  email: string
  name: string
  role: 'owner' | 'cashier'
}

async function listUsers(): Promise<UserRecord[]> {
  const token = getToken()
  const res = await fetch(`${apiBaseUrl}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

async function updateUser(id: string, data: UpdateUserValues): Promise<UserRecord> {
  const token = getToken()
  const res = await fetch(`${apiBaseUrl}/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update user')
  return res.json()
}

async function toggleUserActive(id: string): Promise<UserRecord> {
  const token = getToken()
  const res = await fetch(`${apiBaseUrl}/api/users/${id}/toggle-active`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Failed to toggle user active status')
  return res.json()
}

async function createUser(data: CreateUserValues): Promise<UserRecord> {
  const token = getToken()
  const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json()
}

// --- TanStack Query Hooks ---

const usersQueryKey = ['users'] as const

export function useUsersQuery() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: listUsers,
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserValues }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useToggleUserActiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserValues) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/users-api.ts
git commit -m "feat: add users API client and TanStack Query hooks"
```

---

### Task 8: Frontend — Settings Layout Route and Component

**Files:**
- Create: `frontend/src/routes/erp.settings.tsx`
- Create: `frontend/src/erp/settings/SettingsLayout.tsx`

- [ ] **Step 1: Create the settings layout route**

`frontend/src/routes/erp.settings.tsx`:
```tsx
import { Outlet, createRoute } from '@tanstack/react-router'

import { SettingsLayout } from '@/erp/settings/SettingsLayout'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'settings',
  component: SettingsRoute,
})

function SettingsRoute() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  )
}
```

- [ ] **Step 2: Create the settings layout component**

`frontend/src/erp/settings/SettingsLayout.tsx`:
```tsx
import { type ReactNode } from 'react'
import { FolderCog, Users } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SettingsNavItem {
  label: string
  icon: typeof Users
  to: string
}

const settingsNavItems: SettingsNavItem[] = [
  { label: 'User Management', icon: Users, to: '/erp/settings/users' },
]

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <div className="flex h-full gap-6">
      <aside className="w-56 shrink-0 space-y-1">
        <div className="mb-4 flex items-center gap-2 px-3 text-sm font-medium text-muted-foreground">
          <FolderCog className="h-4 w-4" />
          Settings
        </div>
        {settingsNavItems.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <a
              key={item.label}
              href={item.to}
              className={cn(
                buttonVariants({ variant: isActive ? 'secondary' : 'ghost' }),
                'h-10 w-full justify-start gap-3 rounded-card px-3',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          )
        })}
      </aside>
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/routes/erp.settings.tsx frontend/src/erp/settings/SettingsLayout.tsx
git commit -m "feat: add settings layout route with sub-navigation"
```

---

### Task 9: Frontend — User Management Child Route and Page

**Files:**
- Create: `frontend/src/routes/erp.settings.users.tsx`
- Create: `frontend/src/erp/settings/users/UserManagementPage.tsx`

- [ ] **Step 1: Create the user management child route**

`frontend/src/routes/erp.settings.users.tsx`:
```tsx
import { createRoute } from '@tanstack/react-router'

import { UserManagementPage } from '@/erp/settings/users/UserManagementPage'

import { Route as settingsRoute } from './erp.settings'

export const Route = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'users',
  component: UserManagementPage,
})
```

- [ ] **Step 2: Create the user management page component**

`frontend/src/erp/settings/users/UserManagementPage.tsx`:
```tsx
import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  useUsersQuery,
  useToggleUserActiveMutation,
  type UserRecord,
} from '@/lib/users-api'

import { UserFormDialog } from './UserFormDialog'

export function UserManagementPage() {
  const { data: users = [], isLoading, error } = useUsersQuery()
  const toggleActiveMutation = useToggleUserActiveMutation()
  const [searchQuery, setSearchQuery] = useState('')
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user)
    setUserDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setUserDialogOpen(true)
  }

  const handleToggleActive = (userId: string) => {
    toggleActiveMutation.mutate(userId)
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load users. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Input
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          {searchQuery ? 'No users match your search.' : 'No users found.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active === false ? 'destructive' : 'outline'}>
                      {user.is_active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user.id)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {user.is_active === false ? 'Activate' : 'Deactivate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/routes/erp.settings.users.tsx frontend/src/erp/settings/users/UserManagementPage.tsx
mkdir -p frontend/src/erp/settings/users
git commit -m "feat: add user management page with table and search"
```

---

### Task 10: Frontend — User Form Dialog (Create/Edit)

**Files:**
- Create: `frontend/src/erp/settings/users/UserFormDialog.tsx`

- [ ] **Step 1: Create the form dialog component**

`frontend/src/erp/settings/users/UserFormDialog.tsx`:
```tsx
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  type UserRecord,
  type CreateUserValues,
  type UpdateUserValues,
} from '@/lib/users-api'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRecord | null // null = create mode
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()
  const isEditing = user !== null

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'cashier'>('cashier')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
      setPassword('')
      setPin('')
    } else {
      setName('')
      setEmail('')
      setRole('cashier')
      setPassword('')
      setPin('')
    }
    setError('')
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }

    if (!isEditing && !password.trim()) {
      setError('Password is required for new users.')
      return
    }

    try {
      if (isEditing && user) {
        const data: UpdateUserValues = { name, email, role }
        await updateMutation.mutateAsync({ id: user.id, data })
      } else {
        const data: CreateUserValues = { name, email, role, password, pin }
        await createMutation.mutateAsync(data)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: 'owner' | 'cashier') => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN (optional, for cashier login)</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="4-6 digits"
                  maxLength={6}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify UI package dependencies**

The form uses shadcn-style components (`Dialog`, `Select`, `Label`, `Badge`, `Skeleton`). Verify these exist under `frontend/src/components/ui/`:
- `dialog.tsx` (for `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`)
- `select.tsx` (for `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`)
- `label.tsx` (for `Label`)
- `badge.tsx` (for `Badge`)
- `skeleton.tsx` (for `Skeleton`)
- `button.tsx` (for `Button`)
- `input.tsx` (for `Input`)

If any are missing, create them following the existing shadcn-style patterns in the project.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/erp/settings/users/UserFormDialog.tsx
git commit -m "feat: add user create/edit dialog"
```

---

### Task 11: Update ERP Nav — Link Settings as Parent

**Files:**
- Modify: `frontend/src/erp/navigation/ErpNav.tsx`

- [ ] **Step 1: Change Settings `to` from `null` to `/erp/settings`**

In `frontend/src/erp/navigation/ErpNav.tsx`, change line 28:
```tsx
// Before:
{ label: 'Settings', icon: Settings2, to: null },

// After:
{ label: 'Settings', icon: Settings2, to: '/erp/settings' },
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/erp/navigation/ErpNav.tsx
git commit -m "feat: link Settings nav item to settings layout"
```

---

### Self-Review Checklist

**Spec coverage:**
- ✅ `is_active` column migration → Task 1
- ✅ New sqlc queries (ListUsers, UpdateUser, ToggleUserActive) → Task 2
- ✅ Regenerate sqlc → Task 3
- ✅ Backend service methods → Task 4
- ✅ Backend handler/routes → Task 5
- ✅ Wire routes in bootstrap → Task 6
- ✅ Frontend API client + hooks → Task 7
- ✅ Settings layout route/component → Task 8
- ✅ User management page with table/search → Task 9
- ✅ User form dialog (create/edit) → Task 10
- ✅ Nav update → Task 11

**Placeholder scan:** No TODOs, TBDs, or missing code blocks.

**Type consistency:** `UserRecord` type used consistently across tasks 7, 9, 10. `UpdateUserValues` and `CreateUserValues` types aligned. Backend `User` struct fields consistent.
