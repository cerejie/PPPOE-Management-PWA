# Memory — Product Principles

Domain-agnostic. These outlive any single application.

1. **Build a product system, not features.** Every change should leave the system better, not just satisfy the ticket.
2. **Architecture precedes implementation.** Deciding boundaries after writing code means living with accidental ones.
3. **UI/UX precedes backend** for user-facing work. The interface reveals the real data requirements; the schema rarely reveals the real interface.
4. **Mobile/PWA is a first-class experience.** A shrunken desktop screen is a broken product on the device most people use.
5. **Reuse before create.** Duplicated logic is the main source of long-term inconsistency.
6. **Simplicity before sophistication.** The simplest design that can scale wins over the clever one that already does.
7. **Reliability before cleverness.** Users forgive plain; they do not forgive lost work.
8. **Data integrity is not negotiable.** Never lose a user's input silently — not on a bad network, not on a conflict, not on a crash.
9. **Security is explicit.** Anything implicit is absent.
10. **Performance is designed, not patched.** Choose the right shape, then measure.
11. **Every module is understandable, testable, and replaceable** by someone who did not write it.
12. **Conventions over one-off decisions.** A consistent system is faster to work in than a locally optimal one.
13. **Progressive disclosure.** Show what is needed now; reveal depth on request.
14. **Honest reporting.** Half-done reported as done is worse than half-done.
15. **The engineering system is the asset.** Applications are implementations built on top of it.

## Trade-off default

When two principles collide, apply `CLAUDE.md` §3. When that does not resolve it, choose the option a competent engineer joining in a year would thank you for.
