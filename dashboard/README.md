# PaperParser Dashboard

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

This repo ships mock data copied from `schema/examples/*.example.json`.

### Load a local run (Phase 3)

If you generated a local bundle under `ref/runs/<run>/parser-run/`, copy it into the dashboard data folder:

```bash
# Medium
PYTHONDONTWRITEBYTECODE=1 python3 tools/sync_bundle_to_dashboard.py ref/runs/medium_mueller/parser-run --backup --validate
```

To load the long run instead:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 tools/sync_bundle_to_dashboard.py ref/runs/long_nalini/parser-run --backup --validate
```

To revert to the tracked mock data:

```bash
git restore dashboard/public/data
```

## Schema validation (dev)

On load, the dashboard validates the JSON against the canonical schemas in `../schema/*.schema.json` using AJV.
