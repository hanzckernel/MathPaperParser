# Architecture Research: PaperParser v1.2

**Milestone:** `v1.2 Dashboard, Export & Math Rendering Hardening`
**Status:** Research skipped
**Date:** 2026-04-03

Architecture direction for this milestone:
- Keep the shipped stored-paper data model unchanged unless export compatibility requires a minimal additive adjustment.
- Preserve the exported `data/` layout consumed by the React dashboard.
- Treat dashboard bootstrap, MathJax rendering, fragment normalization, and runtime guard behavior as first-class product behavior, not incidental implementation detail.
