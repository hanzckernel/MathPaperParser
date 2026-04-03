# UI Review — Phase 15: Math Fragment Render Hardening

Overall score: 20/24

| Pillar | Score | Notes |
|--------|-------|-------|
| Copywriting | 4/4 | Fallback messaging is explicit and now only appears for real unsupported fragments. |
| Visuals | 3/4 | Statement cards are readable and consistent, but rendered math still sits in a fairly generic container style. |
| Color | 3/4 | Error and fallback states are legible; accent use is coherent but still conservative. |
| Typography | 3/4 | Math output is now correctly typeset in-browser; surrounding UI typography remains serviceable rather than distinctive. |
| Spacing | 4/4 | Explorer and graph detail layouts keep readable density and no longer collapse around failed math rendering. |
| Experience Design | 3/4 | The critical rendering failure is fixed, but frontend verification still leans on targeted technical tests rather than full browser-flow coverage. |

## Findings

1. Fixed: the dashboard treated MathJax script `onload` as runtime readiness and fell back before `startup.promise` attached browser typesetting hooks.
2. Fixed: static exports omitted MathJax `assets/sre/`, which caused `speech-worker.js` fetch failures and noisy console errors on exported pages.
3. Residual: statement containers are stable and readable, but their visual treatment is still a utility shell rather than a deliberately designed reading surface.

## Evidence

- Fresh explorer verification on a rebuilt static export renders the Petri theorem statement without the raw-source fallback block.
- Static export now serves:
  - `assets/tex-chtml-nofont-*.js`
  - `assets/sre/speech-worker.js`
  - `assets/sre/mathmaps/*.json`
- Regression coverage now exists for:
  - MathJax startup timing in `packages/web/test/math-render.test.ts`
  - static export worker assets in `packages/cli/test/export-command.test.ts`

## Top Fixes

1. Keep MathJax readiness tied to `startup.promise`, never bare script `onload`.
2. Treat MathJax worker assets as part of the static export contract, not optional extras.
3. Add one browser-level acceptance check for exported theorem explorer rendering to catch future regressions beyond unit and export structure tests.
