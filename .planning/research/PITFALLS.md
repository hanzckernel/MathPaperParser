# Pitfalls Research: PaperParser v1.2

**Milestone:** `v1.2 Dashboard, Export & Math Rendering Hardening`
**Status:** Research skipped
**Date:** 2026-04-03

Known risks to avoid:
- stale export assumptions between CLI output and dashboard loader
- dashboard surfaces continuing to show raw math strings even though the product expectation is readable MathJax-rendered equations
- passing line-broken or package-dependent TeX fragments directly to the renderer and expecting `amsmath` / `amsthm` compatibility to repair them
- mismatched mount targets between built shells and runtime bootstrap
- unsupported `file://` usage failing silently instead of surfacing an actionable message
- broadening scope into deployment, collaboration, or new ingestion modes before the current export/render path is stable
