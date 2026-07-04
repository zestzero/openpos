# Issue: Clean nested card styles and improve density

Status: ready-for-agent

## Goal
Flatten the user interface by removing nested card borders, reducing padding, and using divider-separated lists to improve data density.

## Tasks
1. **Remove nesting in lists**:
   - In `pos.inventory.tsx`, the lists of Draft Adjustments and Sync Queue items should be styled as flat list rows separated by simple borders (`border-b border-gray-100 last:border-0`) rather than nested cards.
2. **Review other list components**:
   - Check `CartItemRow.tsx` and other card containers to ensure they use flat, dense styles suitable for professional retail use.
