# Phase 27: Drag-and-Drop TeX Upload - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `27-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-06
**Status:** Complete

## Discussion Summary

The discussion established that Phase 27 is not about inventing upload from scratch. The API-backed upload flow already exists, so the only open design questions were where the drop target lives, what dropped files are accepted, whether dropping uploads immediately, and how visible the drag-active state should be.

The user chose the recommended bounded path on all four axes: a dedicated drop zone in the existing upload controls, `.tex`-only drop support, immediate upload using the current optional paper-id field, and explicit drag-active highlighting with the existing inline status area.

## Questions and Selections

### 1. Drop surface
**Question:** Where should drag-and-drop live?

**Options presented:**
- `1A` Dedicated drop zone inside the existing upload controls only.
- `1B` Whole dashboard page is a drop target.
- `1C` Both dedicated zone and whole-page fallback.

**Selected:** `1A`

**Captured decision:** Phase 27 should add a localized drop zone inside the current upload controls only.

### 2. File scope
**Question:** What kinds of files should drag-and-drop accept?

**Options presented:**
- `2A` Drag-and-drop accepts `.tex` only; the existing picker can stay broader.
- `2B` Drag-and-drop mirrors the current picker scope.
- `2C` Drag-and-drop also tries to support project/archive-style drops.

**Selected:** `2A`

**Captured decision:** Drag-and-drop should be explicitly `.tex`-only and should not widen into archive, directory, or broader file-type support.

### 3. Upload trigger
**Question:** Should dropping a file upload immediately or stage it first?

**Options presented:**
- `3A` Dropping a file uploads immediately using the current optional paper-id field if present.
- `3B` Dropping only stages the file; user still clicks a separate upload action.
- `3C` Auto-upload only when paper id is filled; otherwise block and ask first.

**Selected:** `3A`

**Captured decision:** A valid dropped `.tex` file should upload immediately and should reuse the current optional paper-id field if filled.

### 4. Feedback
**Question:** How visible should the drag state be?

**Options presented:**
- `4A` Add explicit drag-active highlighting and reuse the current inline upload status.
- `4B` Reuse status only, no special drag-active treatment.
- `4C` Add a broader page-level drag overlay/message.

**Selected:** `4A`

**Captured decision:** The drop zone should visually react during drag-over, while progress and errors continue through the existing inline status area.

## Alternatives Not Chosen

- Turning the whole dashboard into a drop target.
- Matching the drop contract to the broader current picker types.
- Supporting archive or project-style drops.
- Introducing a separate staged-upload confirmation flow.
- Adding a page-level drag overlay.

## Deferred Ideas

- Broader drag-and-drop support for Markdown, PDF, or project bundles.
- Whole-page drop handling.
- Separate staged upload UX distinct from the current auto-upload behavior.

---

*Phase: 27-add-one-drag-and-drop-function-of-tex-file-to-the-current-support-scope*
*Discussion logged: 2026-04-06*
