# POS inventory adjustment flow design

## Context

The frontline inventory screen must support older employees working on phones
in a bright, interruption-heavy shop. The current flow exposes a separate
review step and permits direct numeric editing, which adds decisions and makes
direction mistakes easier.

## Design

The route is a single-lane flow: scan or search one variant, adjust it on one
screen, save, and show success. Camera scanning is the dominant action. Search
remains available as a fallback and hardware scanner input stays silent.

The adjustment editor uses explicit Add stock and Remove stock controls,
positive quantity presets plus steppers, and a digit-only custom amount field.
Reasons are plain-language buttons filtered by direction. Current stock and
the resulting stock are visible; the save action is disabled for a removal
that would produce a negative result. The queued adjustment still carries the
existing API reason value and signed delta.

Saving first writes to IndexedDB. Success is shown only after that write
resolves. Offline success uses `Saved on this phone`; failures keep the editor
open. A success screen offers `Adjust another item` and `Done`. Back confirms
only when the editor has changed.

## Error and fallback behavior

- Unknown barcode: `Item not found`, then `Scan again` or search by name.
- Camera failure: `Camera unavailable`, then search by name.
- Failed background sync: keep the normal flow clean and expose Retry only in
  the existing attention strip.

## Verification

The route tests cover scan-first entry, direct save without review, signed
remove deltas, direction-specific reasons, negative-stock prevention, wedge
scanning, offline confirmation, and the absence of a negative-number input.
The frontend TypeScript build remains the compatibility gate.
