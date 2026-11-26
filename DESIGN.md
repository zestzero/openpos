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

- Light canvas (`background`), white work surfaces (`card`), and near-black ink (`foreground` / `primary`) for text and primary buttons.
- Lime (`accent`, about `#C8F169`) is a highlight fill only: selected rows, the change-due panel, one report figure, and the mark on ink. Do not set body copy or prices in lime on a light surface.
- Primary actions are ink pills with light text. Filter chips are light grey; the selected chip is a white surface with a border.
- Green communicates completed or safely stored work and upward deltas; amber communicates offline or needs-attention states; red is reserved for failures, destructive actions, and downward deltas.
- All text meets WCAG AA contrast. Never rely on color alone for state.
- Tokens use OKLCH in `frontend/src/app.css`. Shared pieces live in `frontend/src/components/ui`: `button`, `chip`, `card`, `kpi-stat`, `icon-button`.

## Shape

- Cards use a 24px radius and sit on the canvas with a hairline border. Do not nest a card inside a card.
- Buttons, inputs, and chips are pills. Icon buttons are circles at least 44px.
- Prices, tendered amounts, and change use tabular numbers. The change-due figure sits on a lime panel in ink.

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
