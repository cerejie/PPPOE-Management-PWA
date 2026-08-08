# Template — Architecture Decision Record

Copy this block to the **top** of `roadmap/DECISION_LOG.md`.

## When an ADR is required

A decision that: adds or removes a dependency · changes the dependency graph or a module boundary · changes a data model · changes auth or permissions · accepts a known tradeoff · would be expensive to reverse.

Not required for: routine implementation choices inside an existing pattern.

---

```markdown
## ADR-000N — <decision in one line>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by ADR-000M

**Context**
What forced a decision. The constraints that were real at the time.

**Decision**
What we are doing. Stated so a future reader can act on it without guessing.

**Alternatives considered**
| Option | Why not |
|---|---|
| … | … |

**Consequences**
Positive: …
Negative / accepted cost: …
Reversal cost: cheap | moderate | expensive

**Affects**
`.claude/` files, modules, or standards this changes.
```

---

## Rules

- Write it when the decision is made, not afterwards. The reasoning is what evaporates.
- Record the rejected options — a future reader will otherwise re-propose them.
- Never edit an accepted ADR. Supersede it with a new one and mark the old one.
- If the decision changes a `.claude/` standard, update that file in the same change and reference the ADR from it.
