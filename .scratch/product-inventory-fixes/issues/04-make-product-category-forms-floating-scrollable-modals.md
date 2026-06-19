Status: ready-for-human

# Make Product and Category forms floating scrollable desktop modals

## What to build

Convert the ERP Product and Category create/edit experiences into floating desktop modals with a clear overlay and scrollable content body. Long Product forms with Variant fields and Category forms with parent selection should remain usable on shorter desktop viewports.

## Acceptance criteria

- [ ] Product create/edit opens as a centered floating desktop modal rather than an inline panel or full-page takeover.
- [ ] Category create/edit opens as a centered floating desktop modal with the same interaction model.
- [ ] Modal bodies scroll independently when content exceeds viewport height.
- [ ] Modal header and primary actions remain visible and usable on shorter desktop heights.
- [ ] Long Product names, Category names, descriptions, many Variant rows, validation errors, and API errors do not clip or overflow off-screen.
- [ ] Keyboard focus is managed correctly when opening, navigating, submitting, and closing each modal.

## Blocked by

None - can start immediately
