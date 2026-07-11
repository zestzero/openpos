# OpenPOS Frontline Product Context

## Product purpose

OpenPOS helps a shop employee complete a sale, take payment, print a receipt, and make occasional stock adjustments without needing to understand retail software.

## Users

- Primary: older, day-to-day employees with limited confidence using complex applications.
- Secondary: shop owners who may use the POS but manage the business through the separate ERP interface.
- Primary device: a phone used at a bright, interruption-heavy counter, sometimes with a camera or keyboard-wedge barcode scanner.

## Product register

`product`

## Core jobs

1. Find or scan products and add them to a sale.
2. Check quantities and totals.
3. Take cash or PromptPay payment and show change clearly.
4. Continue selling offline without losing paid transactions.
5. Find one product and record a stock adjustment.

## Experience principles

- One task and one dominant action per screen.
- Use plain, short labels. Never expose implementation terms such as queue, wedge, payload, or sync during successful work.
- Prefer visible steps and labeled controls over icons, hidden gestures, and transient messages.
- Preserve work across refreshes, connection changes, and recoverable failures.
- Thai is the default frontline language; English remains a supported fallback.
- Selling is always easier to reach than inventory or account actions.

## Anti-references

- Analytics dashboards, dense admin panels, command palettes, and card-heavy SaaS layouts.
- Decorative marketing treatments, atmospheric gradients, glass surfaces, tiny status pills, and hover-dependent controls.
- Interfaces that optimize for expert density at the expense of first-time comprehension.

## Success measures

- A common cash sale takes no more than five deliberate actions after products are selected.
- Every successful screen has one obvious next action.
- The employee can recover from an error without losing the current order.
- No normal sales or stock flow requires horizontal page scrolling at 320px width.
