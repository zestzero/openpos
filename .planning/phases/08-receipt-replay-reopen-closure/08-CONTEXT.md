# Phase 08: Receipt Replay & Re-open Closure - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire persisted receipt lookup into the POS flow so receipt replay and reprint behavior uses the backend `GET /api/orders/{id}/receipt` endpoint instead of relying only on the payment-completion snapshot. This is gap-closure for REC-03 receipt replay/re-open behavior only; it does not add digital receipts, customer history, order editing, discounts, or new payment capabilities.

</domain>

<decisions>
## Implementation Decisions

### Replay Entry Points
- **D-01:** Provide receipt replay from the checkout success path and keep a lightweight “latest receipt” reopen/reprint action in the POS surface.
- **D-02:** Do not add a full recent-orders lookup/list in this phase; that would be a larger POS capability outside this gap-closure scope.

### Receipt Source Rules
- **D-03:** After payment completion, the UI may transition immediately from the payment snapshot, but persisted receipt replay/reprint must fetch `GET /api/orders/{id}/receipt` and treat the backend receipt as the source of truth.
- **D-04:** The implementation should explicitly prove the frontend consumes the existing backend receipt endpoint for replay/reprint, not only the receipt snapshot returned by payment completion.

### Error and Offline Behavior
- **D-05:** Disable receipt replay/reprint while offline rather than attempting an offline replay.
- **D-06:** If persisted receipt fetch fails or the order is missing, show a clear non-destructive error and keep the cashier in the current POS state.
- **D-07:** Fresh checkout printing can keep using the current payment-completion flow, but replay/reprint is an online endpoint-backed action.

### Cashier-Facing UI Language
- **D-08:** Use “Reprint receipt” for the cashier-facing action label.
- **D-09:** Avoid “Reopen sale” wording because it implies editing/resuming an order, which is outside this phase.

### the agent's Discretion
- Exact placement of the lightweight latest-receipt action inside the existing POS layout.
- Loading/disabled visual treatment for the reprint button.
- Exact error copy, as long as it clearly explains offline/unavailable receipt states without disrupting the sale flow.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §Phase 08: Receipt Replay & Re-open Closure — phase goal, dependency, status, and gap-closure intent.
- `.planning/REQUIREMENTS.md` §POS — Receipts and Traceability row `REC-03` — receipt content and pending phase mapping.
- `.planning/PROJECT.md` §§Product Vision, POS Interface, Technical Constraints — mobile-first POS, offline-capable sale loop, THB-only constraints.
- `AGENTS.md` — frontend conventions for TanStack Router/Query, route-separated POS/ERP, shadcn/ui, Tailwind v4, and THB formatting.

### Prior decisions
- `.planning/phases/02-pos-frontend-offline/02-CONTEXT.md` — mobile-first POS shell, thumb-reach actions, shallow navigation, fast cashier workflow.
- `.planning/phases/05-pos-frontend-offline-gap-closure/05-01-SUMMARY.md` — offline sync contract and queue bookkeeping decisions.
- `.planning/phases/06-payments-receipts-sale-finalization/06-02-SUMMARY.md` — payment, receipt, and inventory regression context.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lib/receipt.ts` — existing `buildReceiptText`, `printReceipt`, WebUSB, and dialog fallback receipt printing utilities.
- `frontend/src/lib/api.ts` — existing `GET /api/orders/{id}/receipt` client helper path returns `ApiSuccess<ReceiptSnapshot>`.
- `frontend/src/pos/components/CheckoutPanel.tsx` — existing checkout receipt preview/print surface.
- `frontend/src/pos/components/CartPanel.tsx` — existing sale finalization path that prints receipt after order completion.
- `internal/sales/handler.go` — existing `GET /api/orders/{id}/receipt` route and JSON envelope.
- `internal/sales/service.go` — existing persisted receipt snapshot construction.

### Established Patterns
- POS actions should remain mobile-first, shallow, and cashier-speed oriented.
- Receipt text/printing already flows through shared frontend utilities; reuse them rather than adding a second print pipeline.
- Backend responses use a `{ data: ... }` envelope for receipt payloads.
- Online/offline state should follow the established POS network-status pattern instead of ad hoc checks.

### Integration Points
- Add or update TanStack Query/API usage around the existing receipt endpoint for replay/reprint.
- Connect latest-receipt state to the checkout success/finalization path without creating a broad order-history feature.
- Cover replay behavior with focused frontend tests and/or handler/client tests as appropriate.

</code_context>

<specifics>
## Specific Ideas

- Cashier should see the action as “Reprint receipt.”
- The reprint action should be available from checkout success and a lightweight latest receipt affordance, not a full order lookup screen.
- Persisted backend receipt is the replay source of truth after payment completion.
- Replay/reprint is disabled offline.

</specifics>

<deferred>
## Deferred Ideas

- Full recent-orders lookup/list for choosing older receipts is deferred; it is broader than this receipt endpoint wiring gap.
- “Reopen sale” editing/resume behavior is deferred; this phase only replays/reprints persisted receipts.

</deferred>

---

*Phase: 08-receipt-replay-reopen-closure*
*Context gathered: 2026-05-03*
