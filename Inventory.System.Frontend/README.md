# Inventory System Frontend

React + TypeScript + Vite, with Ant Design components.

## Development

```sh
pnpm install
pnpm dev
```

```sh
pnpm lint
pnpm build
```

## Products prototype

- Product table with sorting and pagination.
- Centered search by name, description, or ID (case and accent insensitive).
- Active/inactive status filter, combined with search.
- Inline creation form with Save and Back actions.
- Required name, nonnegative MXN price, nonnegative integer initial stock, optional description, and active status.
- New products appear at the beginning of the table; saving resets search and filters.
- Responsive layout with horizontal table scrolling on small screens.

Data is simulated in React state and resets on page reload. There is no API integration yet. Product fields are a provisional frontend model; initial stock will need to be recorded as an inventory movement when integrating the backend.

## Visual style

The shared Ant Design theme is configured in `src/App.tsx`: royal blue (`#2452d6`), white surfaces, subtle blue-to-white gradients, soft borders, and 8 px control radii. Page styles are in `src/App.css`; base styles are in `src/index.css`.

Product components and mock data are in `src/features/products/`.
