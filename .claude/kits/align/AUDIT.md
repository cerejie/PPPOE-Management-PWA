# Align — Audit (read-only)

**Change nothing.** Produce `ALIGNMENT_REPORT.md` at the project root.

The audit exists so the size of adoption is known *before* anything is committed
to. An adoption plan proposed without one is guesswork.

---

## Procedure

### 1. Inventory
Package manager and lockfiles · installed stack vs `stack/<chosen>.md` · scripts
present (`lint`, `typecheck`, `test`) · TS strictness flags · file and LOC count.

### 2. Structure delta
Run `structure-lint --level L5 --json`. Group findings by rule. For each: count,
worst offenders, and rough effort.

### 3. Backend coupling  ← *the important section*
Every import of a backend SDK outside `api/`. This number is the true cost of
portability, and it is the one the user most needs to see.
List each file and whether the call is CRUD, auth, realtime, or files —
that mapping *is* the first draft of the port interfaces.

### 4. Dependency-direction violations
Cycles · `common/` importing modules · `api/` importing stores · cross-module imports.

### 5. Drift
Where `.claude/` claims something the code contradicts. **Every contradiction is a
defect in the docs until proven otherwise** — the code is the evidence of what was
actually decided.

### 6. Knowledge not yet captured
Non-obvious rules, derived-state math, trigger↔mirror pairs, hard-won gotchas
living in code comments or commit messages instead of `memory/conventions.md`.
This is usually the most valuable finding in the whole audit and the easiest to lose.

### 7. Proposed ladder
Per rung: current → target, file count, effort (S/M/L), risk, blockers.

---

## Report shape

```markdown
# Alignment Report — <project>   <date>
## Verdict
Currently satisfies **L<n>**. Recommended target **L<n>**. Reaching it: ~<n> PRs.
## 1. Inventory
## 2. Structure delta        (table: rule · count · effort)
## 3. Backend coupling       (table: file · capability)
## 4. Dependency violations
## 5. Doc drift              (table: claim · reality · fix)
## 6. Uncaptured knowledge
## 7. Proposed ladder        (table: rung · scope · effort · risk)
## 8. Recommended first PR
```

## Rules

- Read-only. Not one file edited, including `.claude/`.
- Counts, not adjectives. "**41** relative imports across **12** files", never
  "significant import issues".
- Recommend the smallest first PR that ends green — usually rung 0.
- If the project is already close to a level, say so. **Adoption is often much
  cheaper than the user fears, and an honest audit is the thing that gets it
  started.**
