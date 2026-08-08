---
description: Build a feature through the full working order — design, then implement, then gate.
argument-hint: <what to build>
---

Build: **$ARGUMENTS**

Follow the working order. Do not skip to code.

**1. Locate.** Which module owns this? Does it exist in `memory/conventions.md`?
Search for what already solves part of it — reuse before create.

**2. Load** only the routing-table rows from `.claude/CLAUDE.md` §4 that apply.
If it touches the backend, `adapters/_ports.md` is mandatory.

**3. Design** — state in a few lines before writing code:
- the one-sentence goal
- files to add/change, at their `core/standards/project-structure.md` paths
- the data contract (Zod schema)
- failure modes, and offline behaviour if `profiles/offline-sync` is active
- mobile behaviour

If anything is a **business rule** you cannot infer, stop and ask. Never invent one.

**4. Implement** in dependency order: schema → types → service → hook → component
→ page → styles → route → constants. ViewModel hook + presentation component,
always. All writes in the module's service.

**5. Verify** with `/gate`.

Show the diff and the changed file paths. Not unchanged code.
