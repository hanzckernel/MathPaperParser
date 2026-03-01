# PaperParser Dashboard (Phase 1 Scaffold)

## Quickstart

```bash
cd dashboard
npm install
npm run dev
```

Then open the dev server URL printed by Vite.

## Data

The app loads a PaperParser bundle from:

- `dashboard/public/data/manifest.json`
- `dashboard/public/data/graph.json`
- `dashboard/public/data/index.json`

Phase 1 ships mock data copied from `schema/examples/*.example.json`.

## Schema validation (dev)

On load, the dashboard validates the JSON against the canonical schemas in `../schema/*.schema.json` using AJV.

