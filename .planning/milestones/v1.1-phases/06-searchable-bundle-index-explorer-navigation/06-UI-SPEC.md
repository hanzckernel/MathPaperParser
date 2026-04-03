---
phase: 06
slug: searchable-bundle-index-explorer-navigation
status: draft
shadcn_initialized: false
preset: not applicable
created: 2026-04-03
---

# Phase 06 — UI Design Contract

> Visual and interaction contract for the paper-local search surface added in the explorer shell.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | none |
| Font | IBM Plex Sans |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tiny label gaps |
| sm | 8px | Inline chips and metadata rows |
| md | 16px | Default control spacing |
| lg | 24px | Card padding |
| xl | 32px | Inter-section gaps |
| 2xl | 48px | Major stacked panels |
| 3xl | 64px | Page-level breathing room |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 15px | 400 | 1.5 |
| Label | 12px | 600 | 1.4 |
| Heading | 24px | 700 | 1.2 |
| Display | 40px | 700 | 1.05 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #0f172a | App background and main shells |
| Secondary (30%) | rgba(15, 23, 42, 0.72) | Cards, control panels, result surfaces |
| Accent (10%) | #38bdf8 | Search focus, active result, jump action |
| Destructive | #ef4444 | Error-only messaging |

Accent reserved for: active search result, focused input states, and the primary "Open in Explorer" action

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Open in Explorer |
| Empty state heading | No matches in this paper |
| Empty state body | Try a label, theorem number, or distinctive phrase from the statement. |
| Error state | Search unavailable: refresh the paper data or check the API connection. |
| Destructive confirmation | not applicable: no destructive action in this phase |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not required |

---

## Interaction Contract

- Search lives in the existing dashboard shell, not in a separate route.
- Result rows must show enough metadata to disambiguate nearby hits before navigation:
  - kind
  - label
  - section
  - paper-local identifier such as number or `latexLabel` when available
- Selecting a result should navigate the user into the existing explorer route and focus the corresponding node.
- The graph-page search box remains a graph-local visibility filter and must not replace the ranked search result list.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
