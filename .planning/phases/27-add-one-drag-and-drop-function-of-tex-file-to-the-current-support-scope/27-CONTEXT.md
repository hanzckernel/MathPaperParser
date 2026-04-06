# Phase 27: Drag-and-Drop TeX Upload - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a drag-and-drop upload path to the existing API-backed document upload controls. This phase is a UX hardening slice on top of the already-shipped browser upload endpoint and current auto-upload behavior. It does not redesign the upload API, add archive or directory ingestion, or broaden supported production inputs beyond the bounded TeX drop contract chosen here.

</domain>

<decisions>
## Implementation Decisions

### Drop Surface
- **D-01:** Phase 27 should add a dedicated drag-and-drop target inside the existing upload controls only.
- **D-02:** The phase should not turn the whole dashboard into a drop target and should not add a page-wide fallback overlay.
- **D-03:** Static-export mode remains unchanged; the drag-and-drop affordance belongs to API mode where upload already exists.

### Accepted Drag Payload
- **D-04:** Drag-and-drop should accept `.tex` files only.
- **D-05:** The existing picker may remain broader, but Phase 27 should not expand drag-and-drop to `.md`, `.pdf`, archives, or project-directory drops.
- **D-06:** If the dropped file is outside the `.tex` contract, the UI should reject it explicitly through the existing upload feedback path rather than attempting best-effort ingestion.

### Upload Trigger
- **D-07:** Dropping a valid `.tex` file should upload immediately, matching the current file-picker auto-upload behavior.
- **D-08:** If the optional paper-id field is filled, the drop upload should use that value.
- **D-09:** Phase 27 should not introduce a second staged-upload confirmation step just for drag-and-drop.

### Feedback Contract
- **D-10:** The drop zone should visibly react to drag-active state so users can tell where drop is supported.
- **D-11:** Upload progress, success, and error messaging should continue to use the current inline upload status area rather than a new notification system.
- **D-12:** Phase 27 should keep feedback local to the upload controls instead of adding a broader page-level overlay or separate modal flow.

### Phase Boundary Discipline
- **D-13:** This phase is a UI affordance improvement on top of the current `POST /api/papers` contract, not a new ingestion capability.
- **D-14:** Project bundles, archive uploads, multiple-file drops, and whole-page drag handling are explicitly out of scope for this phase.

### the agent's Discretion
- The exact wording of the drop-zone guidance text, as long as it makes the `.tex`-only drop contract explicit.
- The exact visual styling for idle versus drag-active states, as long as the state change is obvious and consistent with the existing dashboard controls.
- The exact internal event-handling structure for dragenter/dragover/dragleave/drop behavior.

</decisions>

<specifics>
## Specific Ideas

- The existing upload path already exists in `packages/web/src/App.tsx` and `packages/web/src/lib/api-client.ts`; Phase 27 should extend that path instead of introducing a second upload implementation.
- The obvious UI home is the current "Upload .tex or .md" control block in `packages/web/src/components/data-controls.tsx`.
- Current file-picker behavior already auto-uploads on selection, clears the pending paper id on success, and refreshes the corpus listing; dropped uploads should preserve that behavioral contract.
- Because the user asked specifically for TeX drag-and-drop, the drop-zone language should be explicit that dropping supports `.tex` even if the underlying picker still shows a broader accept list.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active `v1.5` milestone goal and constraints.
- `.planning/ROADMAP.md` — Phase 27 entry and milestone ordering.
- `.planning/STATE.md` — Current milestone position and prior deployment-phase outcomes.

### Existing upload and UI contracts
- `packages/web/src/App.tsx` — Current API-mode upload behavior and auto-upload flow.
- `packages/web/src/components/data-controls.tsx` — Current upload controls where the drop zone should live.
- `packages/web/src/lib/api-client.ts` — Current multipart upload client for `POST /api/papers`.
- `packages/cli/src/server.ts` — Existing deployed upload boundary and request handling.

### Existing tests to extend
- `packages/web/test/data-controls-render.test.ts` — Current render contract for upload controls.
- `packages/web/test/api-client.test.ts` — Current upload client contract.
- `packages/cli/test/serve-app.test.ts` — Existing API upload behavior coverage.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BundleDataControls` already owns the upload inputs, status area, and API-mode-only control surface.
- `uploadSourceDocument()` already builds the multipart request body and accepts an optional `paperId`.
- `App.tsx` already implements the desired immediate-upload behavior for picker-selected files and refreshes the local corpus listing on success.
- The server already persists uploaded files and analyzes them through the current `POST /api/papers` path.

### Established Patterns
- Upload feedback is already surfaced inline through `uploadStatus` and `uploadMessage`.
- API-mode controls are deliberately separated from static-export behavior.
- The app already uses compact, explicit status text rather than toasts or modal feedback.

### Integration Points
- `packages/web/src/components/data-controls.tsx` for drag event handling and visual state.
- `packages/web/src/App.tsx` for any reuse of the existing upload callback path.
- `packages/web/test/` for UI and behavior regressions around accepted file type and drag feedback.

</code_context>

<deferred>
## Deferred Ideas

- Whole-dashboard drag targets or page-wide overlay behavior.
- Drag-and-drop support for Markdown, PDF, archives, directories, or multi-file project uploads.
- Separate staging or confirm-before-upload behavior for dropped files.
- Any server-side ingestion expansion beyond the current upload endpoint.

</deferred>

---

*Phase: 27-add-one-drag-and-drop-function-of-tex-file-to-the-current-support-scope*
*Context gathered: 2026-04-06*
