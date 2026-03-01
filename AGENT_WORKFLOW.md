# Agent Operational Workflow

> **Auto-load:** This document is the canonical source of truth for all agents.
> Read it in full before the first tool call on any task.

---

## 1. Discovery Checklist (Run First on Every Task)

- List files; read `README.md`, `package.json` / `pyproject.toml`
- Identify language, framework, and package manager
- Check linting/formatting config (`.eslintrc`, `ruff.toml`, `pyproject.toml`)

**Framework Discovery — mandatory before writing any new code:**
1. Search the codebase — does this already exist?
2. Check existing dependencies — does a current library solve this?
3. Search for a well-adopted open-source library — is there a standard solution?
> Build custom only if all three checks fail. Note the decision and why.

---

## 2. Code Quality — Non-Negotiable

**Conventions First**
Adopt the existing style, structure, and naming of the codebase before writing anything.

**Core Principles**
- Correctness > Readability > Optimization. No premature optimization.
- Semantic naming: reflect domain concepts, not data shapes (`userAccounts`, not `dataList`).
- No magic constants — use named constants with clear identifiers.
- **Single Responsibility:** each function or module does one thing. If you're writing "and" in a docstring, split it.
- **DRY (3× rule):** extract only when the same logic appears three or more times; not prematurely.
- **No god-files:** if a file exceeds ~300 lines, it likely needs splitting.
- Boy Scout Rule: leave any file you touch marginally cleaner than you found it.

**Error Handling**
- Explicit over silent: surface errors at the boundary, do not swallow exceptions.
- Fail fast with a clear, actionable error message.
- Use language-idiomatic error types (`Result`, typed exceptions, `Error` subclasses — not generic strings).

**Type Safety**
- Python: annotate all public function signatures. Use `mypy`-compatible types.
- TypeScript: enable strict mode (`"strict": true`). Avoid `any`.
- Avoid shape inference for public APIs — prefer explicit interfaces/schemas.

**Documentation & Comments**
- Comments explain *why*, not *what*. Self-documenting code is the goal.
- Every public function/class gets a one-line docstring describing its contract.
- Update docs in the same commit as the code change.

**Testing**
- New public functions require at minimum one happy-path test.
- When fixing a bug, write a failing test first that reproduces it.
- Do not write tests for implementation details — test at the interface boundary.

---

## 3. Safety — Non-Negotiable

- **Git:** never rewrite shared history (`git push --force`). Use `git revert`.
- **Filesystem:** use 3-step atomic `git mv` for case-change renames (via a `tmp_` intermediate).
- **Secrets:** never commit credentials, tokens, API keys, or `.env` files.
- **Ambiguity Gate:** if a requirement has >2 valid interpretations, **stop and ask**. Never guess on scope.

---

## 4. Execution Rules

- Atomic changes: one logical change per commit.
- Trade-off choices: name the choice + one-line reason before implementing.
- Retry a failed command once with a targeted fix. If it fails again, stop and report with the full error.
- **JS/TS:** Always use `CI=true` for Playwright: `CI=true npx playwright test`.
- **Python:** Use `logging`, not `print`. All datetimes in UTC.

---

## 5. Communication

Expert engineer persona: advise against bad practices, don't silently comply. When a request is inadvisable, state the risk in one sentence, then propose the correct alternative.

Use **bold** for emphasis, `code blocks` for paths and commands, `> blockquotes` for warnings.

---

## 6. Language References

<!-- - JS/TS: `GEMINI/INSTRUCTIONS_JS.md`
- Python: `GEMINI/INSTRUCTIONS_PY.md`
- ML/Research: `GEMINI/INSTRUCTIONS_ML.md` -->
