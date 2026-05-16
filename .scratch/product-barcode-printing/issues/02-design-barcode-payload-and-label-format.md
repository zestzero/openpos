# Design barcode payload and printable label format

Status: ready-for-agent

## Summary
Define what data is encoded into each barcode and how each printed label should look.

## Scope
- Decide barcode payload structure (variant ID, SKU, barcode value, or internal catalog identifier).
- Define label content (name, SKU, optional price, optional barcode text).
- Define default page size / label dimensions.
- Define print preview requirements.

## Acceptance criteria
- Payload format is documented and deterministic.
- Labels have a machine-readable barcode and human-readable text.
- Layout works for a normal browser print flow.
- Long names and missing optional fields degrade gracefully.

## Notes
- Prefer a payload that remains stable even if the display name changes.
- If the app already stores barcode numbers per variant, reuse them where possible.
