---
description: Run quality gates against the declared conformance level and report honestly.
---

Run the definition of done for the current change.

1. Read `.claude/PROJECT.md` for `conformance:` and `target:`.
2. Run, and report real output — never assume:
   - `yarn typecheck`
   - `yarn lint`
   - `node scripts/structure-lint.mjs`
   - `yarn test` (only if a real test script exists; if not, say so)
3. Walk `core/skills/review.md`, checking only the sections that apply.
4. Walk `core/workflow/QUALITY_GATES.md` for the gates the declared level enforces
   (`core/standards/conformance.md`).

Report in this shape:

```
Gates at L<declared> (target L<target>)
  typecheck       ✓ / ✗ <output>
  lint            ✓ / ✗
  structure-lint  ✓ / ✗ <n findings>
  tests           ✓ / ✗ / not configured
Review: <what applied, what failed>
Blocking L<next>: <specific, counted>
Skipped: <what and why>
```

**Never report a gate as passing without running it.** Partial completion reported
as complete is the worst failure mode in this system — worse than the incomplete
work itself.
