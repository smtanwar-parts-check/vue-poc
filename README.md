# PartsCheck — Parts Manager (Vue)

Vue entry in the PartsCheck front-end stack bake-off — the same Parts CRUD screen (table + form)
built against the same shared mock REST API as the Angular entry, using the same data, same
branding, same acceptance criteria.

**Stack:** Vue 3.5 (Composition API, `<script setup>`, `defineModel()`), Vuetify 4, VeeValidate +
Zod, a from-scratch virtual-scroll list built on plain Vue reactivity, json-server as the mock API.

## Prerequisites

- Node.js 22.18+ or 24.12+
- npm 10+

## 1. Install dependencies

```bash
npm install
```

## 2. Run the app

One command starts both the mock API (json-server, port 4000) and the Vite dev server (port 5173)
together:

```bash
npm start
```

Then open:

```
http://localhost:5173
```

To run them separately in two terminals:

```bash
npm run api
```

```bash
npm run dev
```

## What you'll see

The **Parts Manager** screen: a paginated, sortable, filterable data table (Vuetify's
`v-data-table-server`), with:

- Add/Edit via a modal dialog — VeeValidate + Zod schema validation, including an async
  SKU-uniqueness check against the live API (debounced, excludes the record's own id in edit mode)
- Delete with a confirmation dialog
- A supplier field (`v-combobox`) with async, debounced autocomplete suggestions — free text is
  still accepted, suggestions are a shortcut
- Loading/empty/error states, snackbar feedback on save/delete
- A responsive layout — the sidebar collapses to an overlay drawer and the table becomes a card
  list below ~768px; try resizing the window or opening dev tools' device toolbar
- Automatic light/dark theme (follows your OS preference)

All of this talks to the mock API in `parts.json` (served by json-server) — creates, edits, and
deletes persist to that file on disk.

## Trying the virtual-scroll demo

The toolbar has a **Paged / Virtual scroll** toggle. Switching to **Virtual scroll** swaps in a
second, independent view browsing a separate 5,000-row synthetic dataset (`partsBulk` in
`parts.json`, untouched by anything you do in the main table).

Unlike the Angular build (which uses Angular CDK's virtual scroll), this is a **from-scratch
implementation built entirely on Vue's own reactivity** (`ref`/`computed`) — no virtual-scroll
library. Only the rows in the current visible window are ever rendered; Vue's own keyed `v-for`
diffing reuses existing DOM elements for rows that stay in view across a scroll, rather than
recreating them. Data loads incrementally in 200-row chunks as you scroll near the edge of what's
already fetched.

This view is read-only — it exists to demonstrate the mechanism, not to duplicate the CRUD screen.

### Regenerating the synthetic dataset

```bash
npm run generate:bulk-parts
```

```bash
npm run generate:bulk-parts -- 10000
```

The second form generates 10,000 rows instead of the default 5,000. This only touches the
`partsBulk` key in `parts.json` — the curated `parts`/`suppliers` arrays are untouched.

## Running tests

```bash
npm test
```

Runs the Vitest suite: unit tests for the query-building and stock-level classification logic
(pure functions, zero Vue/HTTP machinery), plus a component test for the confirm dialog via
`@vue/test-utils`.

## Production build

```bash
npm run build
```

Type-checks (`vue-tsc`) and builds to `dist/`. This only builds the Vue app — json-server is
dev-only tooling standing in for a real backend.

## Project structure

```
src/
  core/
    api/partsApi.ts       Data-access layer — the only thing that calls fetch() for parts
    config.ts              API_BASE_URL
  composables/
    useResource.ts          Vue's answer to Angular's httpResource() — reactive fetch, zero deps
    useVirtualList.ts        The from-scratch virtual-scroll engine
    useIsMobile.ts            Shared breakpoint composable (Vuetify's useDisplay under the hood)
  layout/
    Header.vue, Sidebar.vue, Shell.vue     The three required app-shell components
  shared/
    useNotifications.ts       Singleton toast composable
    ConfirmDialog.vue          Reusable confirm/cancel dialog
  features/parts/
    types.ts                    Part/PartInput/PartCategory
    usePartsQuery.ts              Pure query-param builder (mirrors the Angular parts-query.ts)
    usePartsStore.ts               Module-level singleton composable — the "store" without Pinia
    stockLevel.ts                   Pure out/low/ok classifier
    PartsManagerPage.vue             Smart container — owns dialog state, view-mode toggle
    PartsTable.vue, PartsFilterBar.vue, PartFormDialog.vue, SupplierTypeahead.vue, PartsVirtualList.vue
scripts/
  generate-bulk-parts.cjs   Generates the synthetic partsBulk dataset (CommonJS — this project
                            uses "type": "module", so the .cjs extension is required)
parts.json                 Mock API data — identical to the Angular build's, for a fair comparison
```

## Notable decisions (see `PARTSCHECK-BAKEOFF-NOTES.md` in the Angular repo for full rationale)

- **No Pinia** — a single CRUD screen doesn't earn a state-management dependency, mirroring the
  "no NgRx" call on the Angular side. State lives in plain composables using module-level
  `ref`/`computed`.
- **No virtual-scroll library** — built from scratch on Vue's own reactivity, both as a genuine
  "Vue doesn't need extra deps for this" showcase and to avoid the native-`<table>`-vs-virtualization
  layout conflict that libraries assuming a real `<table>` element run into.
- **Vue 3.5 (stable), not 3.6** — Vue 3.6 is RC only as of this build; Vapor Mode (Vue's
  Virtual-DOM-eliminating compiler mode) was investigated as a possible showcase on the
  virtual-scroll component specifically, but the Vite tooling to opt a single component in isn't
  published in usable form yet (the one dedicated plugin package is a stale, abandoned alpha from
  2024). The app ships fully on stable Vue rather than risk it.
- **Zod v3, not v4** — `@vee-validate/zod` explicitly declares support for Zod `^3.24.0` only;
  Zod v4 restructured its internals in ways the adapter doesn't yet support. Verified via the
  package's own peer dependencies rather than assumed.

## Troubleshooting

**Port 5173 or 4000 already in use** — a previous `npm start` may not have shut down cleanly:

```bash
npx kill-port 5173 4000
```

**"Outdated Optimize Dep" / 504 errors right after starting the dev server** — a normal, one-time
Vite dependency pre-bundling step (especially the first time Vuetify's many component imports get
optimized). Reload the page once; it resolves itself.
