# Phase 5 Runbook — PDF Fallback Bundle Build (Local Only)

This phase adds a **best-effort PDF fallback** for papers where LaTeX sources are unavailable.

The resulting bundle is **schema-valid** and can be exported into a portable `parser-run/dashboard/` folder.

---

## 1) Build a bundle from a PDF

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache PYTHONDONTWRITEBYTECODE=1 python3 tools/build_bundle_from_pdf.py \
  ref/papers/MS_nextstage.pdf \
  --out ref/runs/ms_nextstage/parser-run
```

Notes:
- PDF extraction is heuristic (no `\\label` / `\\ref`), so edges may be incomplete.
- Extracted nodes include `node.metadata.page` for manual cross-checking.

---

## 2) Validate the bundle

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/validate_bundle_schema.py ref/runs/ms_nextstage/parser-run
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/check_bundle_consistency.py ref/runs/ms_nextstage/parser-run
```

---

## 3) Render a static review report

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/render_report.py ref/runs/ms_nextstage/parser-run \
  --out ref/runs/ms_nextstage/report.md
```

---

## 4) Export the dashboard into the bundle

First build the dashboard once (produces `dashboard/dist/`):

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser/dashboard
npm install
npm run build
```

Then export:

```bash
cd /Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser
PYTHONPYCACHEPREFIX=/tmp/pycache python3 tools/export_dashboard_bundle.py \
  ref/runs/ms_nextstage/parser-run \
  --overwrite \
  --backup \
  --validate
```

Open (no server required):
`ref/runs/ms_nextstage/parser-run/dashboard/index.html`

