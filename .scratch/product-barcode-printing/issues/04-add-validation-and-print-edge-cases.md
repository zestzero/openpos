# Add validation and edge-case handling for barcode printing

Status: ready-for-human

## Summary
Cover the expected failure cases and edge conditions for batch barcode generation.

## Scope
- Handle empty selection.
- Handle duplicate selections.
- Handle missing SKU or missing barcode value.
- Handle very long product or variant names.
- Handle label overflow and multi-page printing.

## Acceptance criteria
- User sees a helpful message for invalid or empty selection.
- Duplicate labels are prevented or intentionally deduped according to the chosen product behavior.
- Labels still render when optional fields are missing.
- Multi-page output is readable and consistent.

## Notes
- Add tests where practical for selection dedupe and payload formatting.
- Keep the UX resilient for large batch sizes.
