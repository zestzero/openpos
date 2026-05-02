# POS Prototype Reference

Source prototype: the post-login default register screen, optimized for a bright mobile checkout lane.

## Layout

- Sticky top bar with avatar, `POS Terminal` title, and notification button.
- Register/Stock Management toggle in a soft container.
- Full-width search bar with search icon on the left and scanner icon on the right.
- Horizontal category chips with the active chip filled in mint green.
- Two-column product grid with square cards, image-first cards, and quick add buttons.
- Floating dark `View Cart` bar above the bottom navigation.
- Bottom nav with Sales active and History, Stock, More as secondary tabs.

## Visual Language

- Background: faint mint-tinted surface, not stark white.
- Accent: green primary with pale green containers.
- Corners: large pills for controls, rounded cards for products.
- Depth: 1px borders and soft shadows only.
- Typography: Inter-like hierarchy with compact section labels and clear product names.

## Product Card Pattern

- Square image area with subtle tinted background.
- Bottom-right quick add action.
- Product name, SKU in mono-style text, and price below.

## Interaction Notes

- Search is exact-match lookup, optimized for barcode/SKU entry.
- Add-to-cart should happen immediately with no extra modal.
- Cart total stays visible while browsing.
- Other workspaces can be hidden for now; the POS screen is the default surface.

## Backend-Aware Mapping

- Catalog data comes from `/api/catalog/categories` and `/api/catalog/products`.
- Exact search maps to `/api/catalog/variants/search?q=...`.
- Cart/checkout state remains local until sale completion.
- Sale completion uses `/api/orders` and `/api/orders/{id}/payments`.
