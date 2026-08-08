---
description: Record a significant decision in roadmap/DECISION_LOG.md.
argument-hint: <the decision>
---

Record: **$ARGUMENTS**

Append an entry to `roadmap/DECISION_LOG.md` using `core/templates/adr.md`.

An ADR is required when a decision: adds a dependency, changes the dependency
graph, changes a data model, changes auth or permissions, deviates from the
engineering system, or would be expensive to reverse.

Capture the parts that are impossible to reconstruct later:

- the **alternatives rejected**, and why
- the constraint that actually forced the choice
- what would have to change for this to be revisited

Context and consequences, not a changelog line. If the decision is a deviation
from the system, also add the row to `PROJECT.md` §Deviations.
