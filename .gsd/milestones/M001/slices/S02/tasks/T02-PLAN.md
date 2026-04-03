# T02: 02-pos-frontend-offline 01

**Slice:** S02 — **Milestone:** M001

## Description

Bootstrap the entire frontend application: Vite + React + TanStack Router + shadcn/ui + Tailwind CSS + PWA manifest.

Purpose: No frontend code exists yet. This plan creates the complete project scaffold that all subsequent plans build upon. Establishes routing structure (PLAT-01), PWA foundation (PLAT-04), and component library.

Output: A running Vite dev server with file-based routing, shadcn/ui ready, and PWA manifest in place.

## Must-Haves

- [ ] "Vite dev server starts and renders the root route at localhost"
- [ ] "TanStack Router file-based routing generates route tree with /pos/* routes"
- [ ] "shadcn/ui components are installable and Tailwind CSS classes apply"
- [ ] "PWA manifest.json exists and is linked in index.html"

## Files

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/index.html`
- `frontend/src/main.tsx`
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/pos/route.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/lib/utils.ts`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.js`
- `frontend/src/styles/globals.css`
- `frontend/components.json`
