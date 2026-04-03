---
created: 2026-04-03T20:55:19.799Z
title: Fix stale sample artifact problem
area: general
files:
  - ref/runs/long_nalini/parser-run/dashboard/index.html
  - ref/runs/short_petri/parser-run/dashboard/index.html
  - ref/runs/medium_mueller/parser-run/dashboard/index.html
---

## Problem

The checked-in sample dashboard artifacts under `ref/runs/*/parser-run/dashboard/` are stale relative to the current web export contract. The `long_nalini` sample still references an older KaTeX-era asset bundle, so opening it does not reflect the current MathJax-based dashboard and can appear broken or blank when used as a sample web page.

This creates confusion during manual review because the current application code and acceptance tests are green, but the sample artifact a user is likely to open is not aligned with the shipped renderer/runtime path.

## Solution

Regenerate the checked-in sample dashboard exports from the current code and add a regression that detects stale sample artifacts against the current export contract.

At minimum:
- refresh the sample export assets and HTML shell for the representative sample dashboard
- ensure the sample points at the current bundled assets and MathJax-based runtime path
- add a small test that fails if the checked-in sample export drifts again
