# M001: v1 Core (Foundation → Offline → Payments)

**Vision:** A POS + ERP system for retail stores. Phase 1-3 delivers foundation authentication, mobile-first POS with offline capability, and payment processing. Phase 4 adds ERP backoffice.

## Success Criteria


## Slices

- [x] **S01: Foundation Backend Core** `risk:medium` `depends:[]`
  > After this: Setup the core Authentication service using Encore and TypeORM.
- [ ] **S02: Pos Frontend Offline** `risk:medium` `depends:[S01]`
  > After this: Create a minimal Sales service backend that the POS frontend needs to submit and sync orders.
- [ ] **S03: Payments Receipts** `risk:medium` `depends:[S02]`
  > After this: Extend Order entity with payment fields on backend and frontend to support cash and QR payment completion.
