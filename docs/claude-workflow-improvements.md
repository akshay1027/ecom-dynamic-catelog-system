# Claude Workflow Improvements

Planned improvements to the CI/CD pipeline using GitHub Actions and Claude Code agents. Not yet implemented — tracked here for future sprints.

---

## Overview

Three automated agents triggered on every PR, running in parallel. Each posts PR comments and creates GitHub issues when problems are found.

**Prerequisite:** Add `ANTHROPIC_API_KEY` as a GitHub repository secret (Settings → Secrets and variables → Actions).

---

## Agent 1: Auto Format

**File:** `.github/workflows/format.yml`  
**Trigger:** `pull_request` (opened, synchronize, reopened)

**What it does:**
1. Installs Prettier + ESLint from root `devDependencies`
2. Runs `prettier --write` then `eslint --fix` (Prettier first to avoid ESLint flagging lines that Prettier would fix)
3. Commits any changes back to the PR branch with `"style: auto-fix formatting and lint [skip ci]"` — the `[skip ci]` prevents this workflow from re-triggering on its own push, but E2E and Review workflows will re-run on the formatted code
4. Posts a PR comment: ✅ fixes applied, or ❌ unfixable errors with the full ESLint report
5. Fails the job if unfixable errors remain

**Requires adding to the project:**
- `.prettierrc` — single quotes, 100 char width, trailing commas (matches existing backend style)
- `eslint.config.mjs` — ESLint v9 flat config: CommonJS rules for `backend/`, ESM + JSX + React hooks rules for `frontend/`
- Root `package.json` scripts: `format:check`, `format:fix`, `lint:check`, `lint:fix`
- Root `package.json` devDependencies: `prettier`, `eslint`, `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`

---

## Agent 2: E2E Testing with Playwright

**File:** `.github/workflows/e2e.yml`  
**Trigger:** `pull_request` (opened, synchronize, reopened)

**What it does:**
1. Installs Playwright (Chromium only — ~1 min; all browsers ~5 min, not needed for functional testing)
2. Runs unit + integration tests first as a fast gate — if Jest/Vitest fail, skip the browser launch
3. Playwright's built-in `webServer` starts `node backend/src/server.js` and `vite dev`, polls readiness before running any test (no `sleep` hacks)
4. Runs 12 E2E tests across catalog and admin pages
5. Uploads HTML report + failure screenshots as artifacts (7-day retention)
6. Claude (`anthropics/claude-code-action@beta`) posts a PR comment with pass/fail table, duration, and root-cause analysis for failures
7. On failure: Claude creates a GitHub issue per failing test — title "E2E Failure: `<test name>`", body includes exact assertion, screenshot path, and local reproduction steps

**Requires adding to the project:**
- `e2e/package.json` — `@playwright/test` only (isolated from workspace)
- `e2e/playwright.config.js` — `webServer` config, Chromium only, 1 retry, JSON + HTML reporters
- `e2e/tests/catalog.spec.js` — 6 tests: page loads with products, search filter, category filter, brand filter, price range, click card → detail modal
- `e2e/tests/admin.spec.js` — 6 tests: admin layout loads, brand sidebar lists brands, brand click filters table, Add Product button opens form, form has required fields, submit creates product

**Verified CSS selectors (from source):**  
`.product-card`, `.product-card__name`, `.product-card__meta`, `.product-card__brand`, `.search-filter__input`, `#category-select`, `.admin-layout`, `.admin-sidebar`, `.brand-item`, `.btn-add`, `.product-table`, `.admin-empty`

---

## Agent 3: AI Code Review

**File:** `.github/workflows/review.yml`  
**Trigger:** `pull_request` (opened, synchronize — NOT reopened, to avoid reviews when no new code was pushed)

**What it does:**
1. Fetches the full PR diff (`git diff origin/$BASE...HEAD`)
2. Claude (`anthropics/claude-code-action@beta`) reviews the diff against the project's invariants (see below)
3. Posts inline PR review comments on specific file + line numbers, grouped by severity
4. Submits the review as `REQUEST_CHANGES` (P0 found), `COMMENT` (P1/P2 only), or `APPROVE` (nothing significant)
5. For each P0/P1: creates a GitHub issue "Review: `<description>`" with file, line, problem, why it breaks the system, and the exact fix

**Severity tiers baked into the prompt:**

| Tier | Meaning | Examples |
|------|---------|---------|
| P0 — blocking | Must fix before merge | `app.js` calling `listen()`, store contract violation, silent catch block, API envelope violation (`{ success, data, error }` missing fields), missing `brandId` FK validation |
| P1 — should fix | Important quality issue | Missing try/catch on new routes, hardcoded port/secret, React `useEffect` without cleanup, missing input validation on new endpoints |
| P2 — suggestion | Non-blocking improvement | Logic simplification, missing `aria-label`, naming inconsistency, O(n²) in hot path |

**Project invariants embedded in the review prompt:**
- Store contract: `inMemoryStore.js` exports exactly `{ create, findById, update, remove, search, clear }`
- `app.js` must never call `listen()` — Supertest depends on this
- API envelope: all responses must be `{ success: boolean, data: any, error: { code, message } | null }`
- All errors logged as `{ timestamp, operation, input, error, stack }`
- React `useEffect` that sets state from async calls must return a cleanup/cancel function

---

## Implementation Order

If implementing later, this is the recommended order (each step is independently deployable):

1. **Add Prettier + ESLint config** (`.prettierrc`, `eslint.config.mjs`, root `package.json` scripts) — zero risk, additive only
2. **Deploy Agent 1** (format workflow) — catches style issues immediately
3. **Write Playwright E2E tests** (`e2e/` directory, 12 tests) — verify locally with `cd e2e && npm test`
4. **Add `ANTHROPIC_API_KEY` to GitHub secrets**
5. **Deploy Agent 2** (E2E workflow)
6. **Deploy Agent 3** (review workflow)

---

## Files Summary

| File | Status | Purpose |
|------|--------|---------|
| `.github/workflows/format.yml` | Not created | Agent 1: auto-format |
| `.github/workflows/e2e.yml` | Not created | Agent 2: E2E tests |
| `.github/workflows/review.yml` | Not created | Agent 3: AI code review |
| `.prettierrc` | Not created | Prettier config |
| `eslint.config.mjs` | Not created | ESLint flat config |
| `e2e/package.json` | Not created | Playwright dependency isolation |
| `e2e/playwright.config.js` | Not created | webServer + test config |
| `e2e/tests/catalog.spec.js` | Not created | Catalog E2E tests |
| `e2e/tests/admin.spec.js` | Not created | Admin E2E tests |
