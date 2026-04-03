# T02: 01-foundation-backend-core 02

**Slice:** S01 — **Milestone:** M001

## Description

Implement RBAC, PIN-based login for Cashiers, and Role Enforcement Middleware.
Purpose: Secure the system and provide restricted access based on user roles (Owner vs Cashier).
Output: Cashier creation by Owners, PIN-based login for Cashiers, and middleware to enforce roles.

## Must-Haves

- [ ] "Owner can create cashier accounts with numeric PINs"
- [ ] "Cashiers can log in using their numeric PIN"
- [ ] "Cashiers cannot access owner-only endpoints"

## Files

- `auth/auth.ts`
- `auth/middleware.ts`
