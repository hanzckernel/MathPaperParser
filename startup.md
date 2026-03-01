# Project Startup Checklist

## Project Context

Fill in before starting. Delete lines that don't apply.

```
Goal:         [What this project does and why]
Platform:     [Web / API / CLI / Mobile / Desktop]
Stack:        [Language, framework, runtime — or "TBD"]
Team:         [Solo / N engineers]
Constraints:  [Timeline, required tech, forbidden tech, compliance]
Non-negotiables: [What cannot change regardless of approach]
```

---

## Phase 0 — Clarify (Before Writing Any Code)

Ask only if the answer would materially change the technical approach:

- Is the core problem statement unambiguous?
- Are success criteria defined and measurable?
- Are there hard constraints (specific framework, compliance rules, existing APIs to integrate)?

Summarize understanding in one paragraph. Wait for explicit confirmation before proceeding.

---

## Phase 1 — Discover (Run on Every New Project)

**Framework & Library Discovery (mandatory):**
- Search for existing open-source or commercial solutions — don't build what already exists
- Check the existing codebase for reusable utilities
- Identify build-vs-adopt decision points; note license compatibility for any candidate

**Feasibility (score 0–5):**
Technical fit · Team capability · Timeline · Operational readiness

**Risks:**
Identify top 3 technical risks + one mitigation approach each.

---

## Phase 2 — Propose Technical Approach

- State the chosen stack, architecture pattern, and key libraries
- For significant choices (e.g., REST vs GraphQL, SQL vs NoSQL): name the choice + one-line reason
- Define MVP scope — what is in, what is explicitly deferred
- Note Architecture Decision Records (ADRs) for consequential choices: context + decision + alternatives considered

---

## Phase 3 — Execution Standards (Non-Negotiable)

- Follow all constraints in `AGENT_WORKFLOW.md`
- Security baseline: no hardcoded secrets; explicit CORS origins; least-privilege principles
- **Definition of Done:** code written · types defined · tests pass (or explicitly scheduled) · relevant docs updated

---

## [PROJECT-LEVEL OVERRIDES]

> This section is intentionally blank at the generic level.
> When instantiating for a specific project, add:
> - Domain-specific rules or terminology
> - Required or forbidden libraries
> - Coding conventions that differ from the defaults
> - Additional Definition of Done criteria
> - Architecture decisions already locked in (to avoid re-litigating)
>
> See `specs/README.md` for the recommended project spec pattern.
