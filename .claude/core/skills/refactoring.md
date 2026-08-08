# Skill — Refactoring & Debugging

## Refactoring

Refactor only when it measurably improves readability, maintainability, simplicity, or performance. "It looked odd" is not a reason. Working code has value that a rewrite discards.

### Rules
- **Behaviour must not change.** If behaviour changes, it is a feature change — separate it and say so.
- Never mix refactor and feature in one commit. The reviewer cannot tell which change broke it.
- Tests before, tests after, unchanged. Untested code gets a characterisation test first.
- Smallest sequence of safe steps, each independently correct.
- Never rewrite a whole file to change part of it.

### When to leave it alone
It works, it is not being modified, and nobody is confused by it. Log it in `roadmap/TECH_DEBT.md` and move on.

### Worth doing
Extracting a duplicated business rule · naming something for what it actually does · splitting a component that has grown two responsibilities · replacing derived state with a computed value · breaking a circular import · removing a dead abstraction with one caller.

### Not worth doing
Style churn · re-ordering imports · converting working patterns to a newer idiom for its own sake · adding an abstraction "for when we need it".

## Debugging

1. **Reproduce reliably.** An unreproduced bug is not diagnosed.
2. **Narrow it.** Bisect: which layer, which input, which commit. Read the actual error and the actual data before theorising.
3. **Find the root cause.** Ask why until the answer is a design decision, not a symptom. A fix at the symptom layer means the bug will resurface elsewhere.
4. **State the cause explicitly** before fixing it. If you cannot explain it in one sentence, you have not found it.
5. **Fix the cause**, not the symptom. No defensive `if (x)` guards masking why `x` was missing.
6. **Verify no regression.** Test the fix, re-run the suite, check adjacent behaviour.

Workarounds are allowed only when explicitly requested or when the real fix is blocked — and then they are recorded in `roadmap/TECH_DEBT.md` with the real fix described.

Never "fix" something by removing the assertion, widening the type, catching and ignoring, or adding a retry.
