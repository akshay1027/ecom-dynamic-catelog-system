# Claude Workflow Evolution

---

## v0 — Foundation (2026-05-06)
- Orchestrator + subagents pattern: main session plans and reviews, dedicated subagents implement each phase
- TDD enforced at environment level: PostToolUse hook runs tests on every save, stop hook blocks exit on red, pre-commit blocks commits on red
- ADRs written before code: subagents implement against a written spec, not a verbal description
- Session log + tasks.md established as handoff artifacts for future sessions

## v2 — Planning Gate (2026-05-07)
- Plan mode introduced as a mandatory gate before non-trivial execution
- Parallel subagents for independent workstreams (UI polish + Admin page ran simultaneously)
- `webapp-testing` skill added: Playwright screenshots become part of the definition of "done" for UI features

## v3 — Architecture Analysis (2026-05-07)
- 4-option analysis table (with Postgres migration path) required before any storage or query decision
- Schema-first → UI principle: frontend built to consume a data contract, no hardcoded domain knowledge

## v4 — Plan Rejection Normalized (2026-05-07)
- Plan rejection treated as a valid, expected workflow step — not a failure
- Phase roadmap added to ADRs: future sessions pick up scope without re-deliberating
- Session doc structure standardized: starting/ending test counts, key decisions, deferred items

## v5 — Mental Model Verification (2026-05-07)
- Plan rejected due to mental model mismatch (per-variant rows vs type+values hierarchy) — now explicitly verified in plan before any code
- Context compaction strategy: `/export` → `/compact` at ~80% context usage, not at the limit
- ADR trigger criteria added to CLAUDE.md: document when ≥2 approaches evaluated; skip for patterns already established

---

## Progression at a Glance

| Dimension | v0 | v2 | v3 | v4 | v5 |
|---|---|---|---|---|---|
| Planning | None — inline | Plan mode gate | 4-option analysis | Plan rejection normalized | Mental model check |
| TDD enforcement | Hooks in environment | + E2E screenshots | — | — | — |
| Session continuity | Session doc at end | tasks.md handoff | — | Phase roadmap in ADR | Compact + export pattern |
| ADR practice | 4 decisions | 2 more | 1 (registry) | 1 (variants model) | 1 + trigger criteria |
