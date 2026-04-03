# T01: 01-foundation-backend-core 01

**Slice:** S01 — **Milestone:** M001

## Description

Setup the core Authentication service using Encore and TypeORM.
Purpose: Establish the identity and access control foundation for the entire POS/ERP system.
Output: Operational Auth service with Owner registration and login capabilities.

## Must-Haves

- [ ] "Owner can create an account with email and password"
- [ ] "Owner can log in and receive an authentication token"

## Files

- `auth/encore.service.ts`
- `auth/migrations/1_create_users.up.sql`
- `auth/user.entity.ts`
- `auth/auth.ts`
