# Changelog

User-visible and system-visible changes, newest first. Absolute dates. Not a git log — record what changed for someone using or maintaining the system.

---

## 2026-08-06 — Phase 0: engineering system established

**Added**
- `CLAUDE.md` — entrypoint: load protocol, non-negotiables, decision hierarchy, routing table, definition of done
- `skills/` — architecture, frontend, backend, data, uiux, platform, security, performance, testing, refactoring, review, token-efficiency
- `standards/` — project-structure, naming, frontend, backend, ui
- `workflow/` — development workflow, quality gates, documentation
- `templates/` — feature-module, page, component, service, store, schema, adr
- `memory/` — product-principles, conventions, architectural-decisions
- `roadmap/` — product vision, roadmap, backlog, tech debt, decision log, changelog

**Decisions**
- ADR-0001: `.claude/` is portable and domain-agnostic
- ADR-0002: skills (how) / standards (what) split instead of per-topic duplication

**Status**
No application code. Phase 1 blocked pending the product overview.
