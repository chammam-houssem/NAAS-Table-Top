# Action Situations

A local-first, browser-based canvas for modelling public-service action situations as a living network of relational tables. The application runs entirely offline by default, storing data in IndexedDB with a deterministic schema and providing JSON import/export. Optional hooks for Supabase sync can be added without impacting local behaviour.

## Getting Started

### Prerequisites

- Node.js 22 (ships with TypeScript 5.9)

### Install dependencies

The project is dependency-light and relies only on built-in tooling. Install the few local scripts:

```bash
pnpm install
```

### Development server

```bash
pnpm dev
```

This compiles the TypeScript sources and serves `dist/` with a lightweight HTTP server on port `4173`.

### Build for production

```bash
pnpm build
```

Outputs static assets to `dist/` which can be published to GitHub Pages. The bundle is pure ESM and works offline by default.

### Tests

```bash
pnpm test
```

Compiles the project and executes scripted assertions covering schema validation, store actions, arena expansion, and layout behaviour.

### Linting

```bash
pnpm lint
```

Type-checks the source.

## GitHub Pages deployment

A workflow is provided under `.github/workflows/deploy.yml` that builds the project and publishes the contents of `dist/` to GitHub Pages.

## Optional Supabase Sync

The app is fully functional offline. To add Supabase sync, provide the Supabase client configuration in `src/data/supabase.ts` (placeholder) and expose a UI toggle in settings. The local persistence layer already exposes project-level exports for integration.

## Data Model

- Projects configure allowed link types, arena size, layout, and autosave options.
- Action nodes capture governance metadata, legal bases, rules, abuse examples, tags, and computed completeness.
- Actors model organisations and roles.
- Links connect nodes with typed relationships enforced per project.

A seed project (`Fisheries Pilot`) is created on first load to demonstrate the schema.

## Keyboard Shortcuts

- `N` – create a new node from the inspector
- `L` – create a link to a new action from the inspector (when completeness ≥ 70%)
- `F` – focus/fit canvas (default behaviour)

## Accessibility

Buttons and inputs expose focus styles, and the canvas uses high-contrast elements with sufficient colour ratios.

## License

MIT
