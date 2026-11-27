# Frontend Design System & Storybook Design

## Status

Proposal for review. This document scopes the next frontend workstream; it does not authorize implementation or dependency installation.

## Goal

Establish a discoverable, maintainable component layer under `frontend/src/components/design-system/` and a Storybook workspace that renders it with the same visual tokens and Tailwind styling as the application. The library should make OpenPOS's existing visual rules reusable and reviewable without creating a competing set of low-level primitives.

## Current constraints and context

- The frontend is Vite + React 19 + TypeScript 6 + Tailwind CSS v4. `frontend/vite.config.ts` configures both the Tailwind Vite plugin and `@` → `src` alias; `frontend/tsconfig.json` has the matching alias.
- `frontend/src/components/ui/` is the existing shadcn-compatible primitive layer. It already contains Button, Card, Input, Chip, IconButton, Switch, and other shared primitives, with mixed use of Base UI and local React wrappers. `components.json` maps the `ui` alias there.
- `frontend/src/app.css` owns the OKLCH design tokens, font setup, dark-mode variables, and Tailwind v4 theme mapping. `DESIGN.md` defines the frontline UX constraints: calm high-contrast palette, 48px minimum interactive target, no nested cards, Thai-friendly typography, reduced motion, and accessible state communication.
- Vitest + Testing Library run in jsdom and discover tests under `src`; there is no current Storybook configuration.

## Recommended architecture

Use `components/ui/` as the canonical low-level primitive layer and make `components/design-system/` a higher-level composition layer. Design-system components should compose existing primitives and encode repeated OpenPOS layout or visual patterns; they must not copy, wrap one-for-one, or re-export a parallel Button/Input/Card implementation. If a low-level primitive needs a behavior or variant, change it in `components/ui/` and document that primitive in Storybook.

Start with a narrow set of useful compositions, selected from existing repeated UI patterns during implementation (for example, a page/section heading, a status presentation, or a list-row pattern). Each candidate must have at least two real consumers or a clear cross-product use; do not create generic components just to fill out the catalog. Existing primitives are included in Storybook coverage even though they remain in `components/ui/`. Do not migrate feature screens or rename existing imports in this workstream; adopt design-system components only in new/changed UI unless a specific consumer is explicitly added to scope.

Keep components independently importable from their files and expose a small `components/design-system/index.ts` barrel only for stable public components. Stories live alongside their component as `*.stories.tsx`; existing `ui` primitive stories live alongside those primitives. Avoid moving tokens out of `app.css` in the initial pass: Storybook should import the application's stylesheet rather than fork token values.

## Storybook setup

- Add Storybook using the Vite + React framework package (`@storybook/react-vite`) and its required companion packages. Pin all Storybook packages to one major release, choosing the newest release whose declared peer requirements support the repository's Vite 8, React 19, Node 20, and package manager constraints. Do not upgrade Vite, React, Tailwind, or TypeScript merely to accommodate Storybook; if no supported release exists, stop and bring the compatibility conflict back for a decision.
- Configure `.storybook/main.ts` with the framework and story globs for both `src/components/ui/**/*.stories.tsx` and `src/components/design-system/**/*.stories.tsx`. Use the repository Vite configuration so its `@` alias and Tailwind Vite plugin are reused; do not duplicate or redefine either setting in Storybook.
- Configure `.storybook/preview.ts` (or `.tsx` if decorators require JSX) to import `../src/app.css` once. This preserves font loading, Tailwind v4 compilation, and application tokens. Stories should use the real application theme; do not add a separate theme/token stylesheet or override global styles to make stories look correct.
- Add package scripts for starting Storybook locally and producing a static Storybook build. Keep Storybook artifacts out of the application build and do not add automatic deployment in this workstream.

## Initial catalog and story requirements

1. Include stories for existing shared primitives that have stable public props: Button, Card, Input, Chip, IconButton, and Switch. Add other existing primitives only when they have meaningful variants/states worth documenting; avoid turning feature-specific dialogs and form flows into generic catalog components.
2. Add only the small, evidence-backed composition set described above under `design-system/`. Each story documents its intended use and public props, and demonstrates normal, disabled/invalid/selected states where applicable. Prefer Controls/args for meaningful props over duplicated hand-authored examples.
3. Cover keyboard focus, accessible names, disabled state, and state conveyed without color alone. Keep sample copy and text lengths representative of Thai and English layouts. Story examples are presentation fixtures, not production data or app routes.
4. Exclude dropdown and modal design/implementation from this workstream; they are separate work items.

## Quality and accessibility strategy

- Keep Vitest + Testing Library as the behavioral test layer. Add focused tests only for non-trivial design-system behavior or accessibility contracts; do not snapshot every presentational variant.
- Add Storybook's accessibility addon (with its automated checks enabled) and use stories to inspect visual and keyboard states. Treat automated accessibility output as a useful gate, not a replacement for keyboard and screen-reader semantics review.
- Storybook stories are discoverable documentation and visual examples, not a substitute for the existing app build or tests. The implementation workstream should verify the Storybook dev server and static build, and run focused Vitest coverage plus the regular frontend build/test gate after all changes.

## Scope boundaries and migration

In scope: design-system composition folder, small component API, stories for the initial catalog, Storybook config and package scripts/dependencies, focused tests where needed.

Out of scope: redesigning `DESIGN.md` or token values; replacing or relocating existing `components/ui` primitives; converting all POS/ERP screens; adding app runtime routes or behavior; introducing another component library; dropdown/modal work; CI deployment or visual-regression infrastructure. Existing consumers remain untouched until separately migrated with concrete product needs.

## Acceptance criteria

- `frontend/src/components/design-system/` contains composition-level components only; there is no duplicate primitive implementation or feature-screen migration.
- Storybook starts and builds using the repository's existing Vite alias, Tailwind v4 plugin, and `app.css` tokens, with dependencies compatible with the current toolchain and no unrelated toolchain upgrades.
- Stories cover the stable shared primitives and every new design-system component, including relevant states and documented usage.
- Accessibility review includes keyboard operation/focus, accessible names, non-color state cues, and the existing minimum-touch-target/frontline constraints where interactive.
- Focused behavioral tests cover any non-trivial interactions; no blanket snapshots are added.
