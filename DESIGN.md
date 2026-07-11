# OpenPOS Frontline Design System

## Scene and direction

An older cashier holds a phone at a bright shop counter while customers wait and interruptions are common. The interface is light, high-contrast, calm, and utilitarian. It should feel more like a dependable appliance than a configurable dashboard.

## Hierarchy

- One primary action per screen, full width and 64px high at the bottom of the phone viewport.
- Core task text is 18px or larger; secondary copy is 16px or larger.
- Primary touch targets are 56px. No interactive target is smaller than 48px.
- Use tabular numbers for prices, tendered amounts, and change.
- Keep content in one readable column with a maximum width of 672px.

## Color

- Warm, glare-resistant neutral background and near-black warm text.
- Orange is reserved for the current selection, focus, and primary action.
- Green communicates completed or safely stored work; amber communicates offline or needs-attention states; red is reserved for failures and destructive actions.
- All text meets WCAG AA contrast. Never rely on color alone for state.
- Tokens use OKLCH in `frontend/src/app.css`; components consume semantic Tailwind tokens.

## Components

- Buttons use clear verb labels. Consequential actions may pair a familiar icon with text, never an icon alone.
- Product tiles show only image, name, and price. A product with multiple variants opens a focused chooser.
- Lists use spacing and dividers instead of nested cards.
- Forms reveal advanced options progressively. Discounts stay collapsed until requested.
- Dialogs are limited to camera scanning, variant choice, and destructive confirmation. Task steps use full screens.
- Feedback that changes the next action remains visible; do not rely solely on toasts.

## Motion and responsive behavior

- State feedback may use short opacity or transform transitions; no decorative animation or layout-property animation.
- Honor `prefers-reduced-motion` globally.
- Support 320px-wide phones, safe-area insets, 200% zoom, keyboard navigation, camera scanning, and keyboard-wedge scanning.
- Do not hide critical actions on small screens or require horizontal navigation gestures.

## Copy and localization

- POS strings live in `frontend/src/pos/lib/copy.ts`.
- Production defaults to Thai via `VITE_POS_LOCALE=th`; English is the fallback locale.
- Internal enum values stay in English at API boundaries, while employees see plain localized labels.
- Errors state what happened and what the employee can do next. Never blame the employee.
