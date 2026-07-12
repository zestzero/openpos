# POS inventory adjustment flow

## Goal

Make `/pos/inventory` safe and easy for older frontline employees: scan one
product, choose Add or Remove, choose a positive quantity, choose a plain
language reason, save once, and continue to the next item. The flow must work
offline without exposing sync terminology during normal operation.

## Decisions

- Camera/barcode scanning is the primary entry point. Name search is the
  fallback, and keyboard-wedge scans remain silent.
- Each adjustment handles one product variant only. A successful scan closes
  the camera and opens the exact variant. Name matches use a large variant
  chooser.
- Quantity is always a positive integer. `+` and `−` select Add or Remove;
  employees never type a negative number. Presets (`1`, `5`, `10`) and an
  `Other amount` keypad cover common and uncommon quantities.
- Reasons appear on the same screen and are filtered by direction. Add shows
  Restock and Customer return; Remove shows Damaged and Missing. Owner-only
  Count correction remains outside this employee flow.
- Show current stock and live resulting stock. Disable save when a removal
  would make stock negative and explain `Not enough stock` in plain language.
- Save uses one full-width `Save adjustment` action with a live summary.
- Persist to IndexedDB before showing success. Offline success says `Saved on
  this phone`; a local write failure retains the form and offers `Try again`.
- After save, show a short success screen with `Adjust another` primary and
  `Done`/`Back to stock` secondary. Back confirms only when there are unsaved
  changes.
- Unknown barcodes show `Item not found` with `Scan again` primary and
  `Search by name` fallback. Camera errors show `Camera unavailable` and the
  same search fallback.
- Keep adjustment history outside this active flow. Default copy is Thai with
  English fallback; API reason values remain unchanged.

## Implementation slices

1. **Single-screen adjustment UI**
   - Replace the review screen with a single editor.
   - Add explicit Add/Remove controls, quantity presets, positive custom
     amount entry, filtered reason buttons, stock summary, and save summary.
   - Add success secondary action and unsaved Back confirmation.
2. **Scan/search resilience**
   - Make the camera control visually primary, close after a valid scan, and
     provide clear unknown-code and camera-error fallbacks.
   - Preserve keyboard-wedge behavior and variant chooser semantics.
3. **Offline and validation safeguards**
   - Keep IndexedDB queueing as the source of truth and retain the editor on
     write failure.
   - Add tests for direction/reason mapping, stock limits, no negative input,
     direct save, offline success, scan errors, and reset behavior.

## Acceptance checks

- A common adjustment takes one scan, one direction/quantity choice, one
  reason choice, and one save.
- No control accepts or displays a negative quantity.
- Remove is unavailable when the resulting stock would be below zero.
- A successful local IndexedDB write is the only path to `Saved on this phone`.
- Existing `QueuedAdjustment` fields and `/api/inventory/sync` payload values
  remain compatible.
- Existing keyboard scanner and online auto-sync behavior continue to work.
- The route remains usable at 320px width with 48px+ touch targets.
