# User Management — Settings Sub-menu

## Overview

Add a full user management flow to the ERP settings section, allowing owners to list, create, edit, and activate/deactivate users (both owners and cashiers).

## Scope

- Backend: new DB migration, sqlc queries, handler/service methods, API routes
- Frontend: new Settings layout route, User Management child route, API client, TanStack Query hooks

## Backend

### Database

**New migration** `012_add_user_active_flag.up.sql`:
- Add `is_active BOOLEAN NOT NULL DEFAULT true` to `users` table
- Add matching `.down.sql` to drop column

**New/updated sqlc queries** in `db/queries/auth.sql`:
- `ListUsers :many` — SELECT all users (all roles, ordered by created_at DESC)
- `GetUser :one` — already exists as `GetUserByID`, add `is_active` to return set
- `UpdateUser :one` — UPDATE name, email, role WHERE id = $1
- `ToggleUserActive :one` — UPDATE is_active = NOT is_active WHERE id = $1 RETURNING *
- `CreateUser` — already exists, add `is_active` to RETURNING clause

### Handler & Service (`internal/auth/`)

**New service methods:**
- `ListUsers(ctx)` — returns `[]User` (all users, no role filter)
- `GetUser(ctx, id)` — already exists
- `UpdateUser(ctx, id, email, name, role)` — updates fields, validates role
- `ToggleUserActive(ctx, id)` — flips is_active, returns updated user

**New handler methods:**
- `ListUsers` — GET handler, owner-only
- `UpdateUser` — PUT handler, owner-only
- `ToggleUserActive` — PATCH handler, owner-only

**Updated router:**
- Mount at `/api/users` (separate from `/api/auth`), behind auth middleware + owner role check
- Routes: `GET /`, `GET /{id}`, `POST /` (create user with role), `PUT /{id}`, `PATCH /{id}/toggle-active`

### Auth middleware

Already has `RequireRole("owner")` — reuse it on the users router.

## Frontend

### New routes

**`erp.settings.tsx`** — Settings layout route
- Parent: `erpRoute` (as `Route` imported from `./erp`)
- Path: `settings`
- Component: `SettingsLayout` — renders a sub-navigation sidebar/tabs + `<Outlet />`
- Sub-navigation items: "User Management" → `/erp/settings/users`

**`erp.settings.users.tsx`** — User management page
- Parent: `settingsRoute` (as `Route` imported from `./erp.settings`)
- Path: `users`
- Component: `UserManagementPage`

### Components

**`frontend/src/erp/settings/SettingsLayout.tsx`** — Settings shell
- Left sub-nav sidebar (matching ErpNav style) with User Management link
- Right content area with `<Outlet />`

**`frontend/src/erp/settings/users/UserManagementPage.tsx`** — Main page
- User table with columns: Name, Email, Role, Status (Active/Inactive), Created, Actions
- Search/filter by name or email
- "Add User" button → opens create dialog
- Each row has Edit + Toggle Active actions

**`frontend/src/erp/settings/users/UserFormDialog.tsx`** — Create/Edit dialog
- Reused for both create and edit
- Fields: Name, Email, Role (dropdown: owner/cashier), Password (create only), PIN (optional, cashier only)
- TanStack Query mutations for create/update

### API client

**`frontend/src/lib/users-api.ts`** — TanStack Query hooks and fetch functions

```typescript
export interface UserRecord {
  id: string
  email: string
  name: string
  role: 'owner' | 'cashier'
  is_active: boolean
  created_at: string
  updated_at: string
}

// Hooks
useUsersQuery()         // useQuery(['users'], listUsers)
useCreateUserMutation() // useMutation(['users'], createUser)
useUpdateUserMutation() // useMutation(['users'], updateUser)
useToggleUserActiveMutation() // useMutation(['users'], toggleUserActive)
```

### Nav update

**`ErpNav.tsx`**: Change Settings from `{ label: 'Settings', icon: Settings2, to: null }` to `{ label: 'Settings', icon: Settings2, to: '/erp/settings' }`

## Data flow

1. Owner clicks "Settings" in ERP sidebar → settings layout loads with sub-nav
2. Owner clicks "User Management" → user list loads via `GET /api/users`
3. Owner clicks "Add User" → form dialog → `POST /api/users` (single endpoint, role in body)
4. Owner clicks "Edit" → form dialog pre-filled → `PUT /api/users/{id}`
5. Owner clicks "Deactivate/Activate" → `PATCH /api/users/{id}/toggle-active` → list refreshes

## Error handling

- Form validation: required fields, email format, password length
- Server errors shown as inline toast/dialog messages
- Disabled deactivate for last active owner
- Optimistic updates with rollback on error

## Security

- All user management routes require owner role (`RequireRole("owner")`)
- Cannot deactivate own account
- Cannot change own role
