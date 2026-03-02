# Phase 4 Runbook — Build + Export + Validation

This phase is about producing a **portable, self-contained** `parser-run/dashboard/` folder for a specific bundle.

---

## 1) Validate the bundle

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py <parser-run-dir>
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py <parser-run-dir>
```

---

## 2) Build the dashboard once

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser/dashboard
npm install
npm run build
```

This produces `dashboard/dist/` (static site).

---

## 3) Export the dashboard into the bundle

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/export_dashboard_bundle.py \
  <parser-run-dir> \
  --overwrite \
  --backup \
  --validate
```

Output:
```
<parser-run-dir>/dashboard/
  index.html
  assets/...
  data/
    manifest.json
    graph.json
    index.json
```

You can open `<parser-run-dir>/dashboard/index.html` directly in a browser (no server).

---

## 4) Repo-level smoke check

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/phase4_smoke.py
```

