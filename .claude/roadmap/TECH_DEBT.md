# Technical Debt

Every accepted compromise, recorded when it is accepted — not discovered later by someone who assumes it is a bug.

An entry must state the **real fix**. "Clean this up someday" is not an entry.

| ID | Debt | Why accepted | Real fix | Cost of leaving it | Added |
|---|---|---|---|---|---|
| _(none yet)_ | | | | | |

## When to add an entry

- A workaround shipped instead of a root-cause fix
- A performance budget from `skills/performance.md` exceeded
- A standard in `standards/` knowingly not met
- A missing test on risky logic
- A schema shape known to be wrong but expensive to change now
- A dependency pinned or held back for a known reason

## When to pay it down

When the debt is blocking a change you are already making in that area. Do not schedule debt work in isolation unless it is causing incidents — but never let an entry silently expire. Stale entries get reviewed, not deleted.
