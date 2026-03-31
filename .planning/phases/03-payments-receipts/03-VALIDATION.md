---
phase: 3
slug: payments-receipts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (frontend unit/integration), Playwright (E2E) |
| **Config file** | `frontend/vitest.config.ts` (exists), `frontend/playwright.config.ts` (exists) |
| **Quick run command** | `npm run test:unit -- --run --reporter=dot` |
| **Full suite command** | `npm run test` (runs unit + E2E) |
| **Estimated runtime** | ~15 seconds (unit), ~45 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run --reporter=dot`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds (unit tests only)

---

## Per-Task Verification Map

Tasks TBD during planning — will populate with specific verification commands per task.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PAY-01, PAY-02, PAY-03 | unit | `npm run test:unit -- payment` | TBD | ⬜ pending |
| 03-02-01 | 02 | 1 | REC-01, REC-02, REC-03 | unit | `npm run test:unit -- receipt` | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/lib/payment/__tests__/cash-payment.test.ts` — Cash payment validation (tendered >= total)
- [ ] `frontend/src/lib/payment/__tests__/promptpay-qr.test.ts` — QR payload generation (EMVCo format)
- [ ] `frontend/src/lib/printing/__tests__/escpos-buffer.test.ts` — ESC/POS buffer generation (without real printer)
- [ ] `frontend/src/lib/printing/__tests__/receipt-layout.test.ts` — Receipt text formatting (80mm, 48 chars/line)

*If tasks reference MISSING test files, Wave 0 must create scaffolds first.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Receipt prints to thermal printer | REC-01 | Hardware dependency | Connect thermal printer, complete sale, verify receipt prints with correct formatting |
| QR code scans correctly in Thai banking apps | PAY-02 | External app dependency | Generate QR with test PromptPay ID, scan with SCB/Kbank app, verify payment prompt appears |
| iOS AirPrint dialog opens | REC-02 | iOS-specific behavior | Open POS on iOS Safari, complete sale, verify print dialog shows AirPrint options |
| Change calculation displays correctly | PAY-01 | Visual verification | Enter cash tendered, verify change amount matches (tendered - total) |

*These require human verification due to hardware/OS dependencies. Automated tests verify logic only.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
