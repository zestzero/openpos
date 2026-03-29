---
phase: 1
slug: foundation-backend-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Encore Recommended) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `encore test ./...` |
| **Full suite command** | `encore test ./...` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `encore test ./...`
- **After every plan wave:** Run `encore test ./...`
- **Before \`/gsd-verify-work\`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | unit | `encore test ./auth/...` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-02 | unit | `encore test ./auth/...` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | AUTH-03 | integration | `encore test ./auth/...` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | AUTH-04 | integration | `encore test ./auth/...` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | INV-01 | unit | `encore test ./inventory/...` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 1 | INV-04 | unit | `encore test ./inventory/...` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `auth/auth_test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `inventory/inventory_test.ts` — stubs for INV-01, INV-04
- [ ] `catalog/catalog_test.ts` — stubs for Catalog CRUD

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Role-based access enforcement (Owner vs Cashier) | AUTH-05 | Visual/UX flow verification | Log in as cashier, attempt to access owner-only endpoints, verify 403 response in UI/Console. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
