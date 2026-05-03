# Phase 08: Receipt Replay & Re-open Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 08-receipt-replay-reopen-closure
**Areas discussed:** Replay entry points, Receipt source rules, Error/offline behavior, UI wording/state

---

## Replay Entry Points

| Option | Description | Selected |
|--------|-------------|----------|
| Success + latest | Show receipt/reprint on checkout success and keep a lightweight “latest receipt” reopen action in POS. | ✓ |
| Success only | Only fetch persisted receipt immediately after payment completes; no later reopen affordance. | |
| Order lookup list | Add a recent orders surface where cashier can choose an order and fetch receipt. | |
| You decide | Let the planner choose the smallest implementation that proves backend receipt replay is wired. | |

**User's choice:** Success + latest
**Notes:** Keep phase small; do not create a full order lookup/list.

---

## Receipt Source Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Backend after payment | Payment completion can navigate/display immediately, then persisted backend receipt is fetched for replay/reprint source of truth. | ✓ |
| Always endpoint | Always fetch `GET /api/orders/{id}/receipt` before showing/printing, including immediately after payment. | |
| Snapshot fallback | Use payment snapshot as primary for speed, endpoint only if reopening later. | |
| You decide | Let implementation choose as long as replay explicitly uses the endpoint. | |

**User's choice:** Backend after payment
**Notes:** Replay/reprint must explicitly consume the backend receipt endpoint.

---

## Error/Offline Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Clear blocking message | Show a clear non-destructive error; keep current POS state; allow retry when online. | |
| Fallback to snapshot | If an in-memory/local snapshot exists, allow reprint from it while warning it may not be persisted. | |
| Disable offline replay | Hide/disable replay when offline; only allow fresh checkout printing from current payment flow. | ✓ |
| You decide | Let the planner pick the simplest safe behavior. | |

**User's choice:** Disable offline replay
**Notes:** Persisted receipt replay/reprint is an online endpoint-backed action.

---

## UI Wording/State

| Option | Description | Selected |
|--------|-------------|----------|
| Reprint receipt | Concrete cashier language; implies persisted receipt retrieval for printing again. | ✓ |
| View receipt | Better if first step is previewing on-screen, with print as secondary action. | |
| Reopen sale | Suggests editing/resuming a sale; likely too broad for this gap-closure phase. | |
| You decide | Let implementation choose wording that fits existing UI. | |

**User's choice:** Reprint receipt
**Notes:** Avoid “Reopen sale” because it implies editing/resuming an order.

---

## the agent's Discretion

- Exact latest-receipt placement inside the existing POS UI.
- Exact loading/disabled state styling.
- Exact non-destructive error copy.

## Deferred Ideas

- Full recent-orders lookup/list for choosing older receipts.
- “Reopen sale” editing/resume behavior.
