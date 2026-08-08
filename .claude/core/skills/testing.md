# Skill — Testing

Use when: writing tests, or deciding whether a change needs them.

## What earns a test

| Test it | Don't |
|---|---|
| Business rules and calculations | Framework behaviour |
| Boundaries: validation, authorisation, parsing | Getters, trivial mappers |
| Bug fixes (test reproduces the bug first) | Implementation details |
| State transitions and edge cases | Snapshot of an entire page |
| Anything money-, permission-, or data-integrity-related | Styling |

Coverage percentage is not a goal. Confidence in the risky parts is.

## Shape

- **Unit** — pure logic: services, reducers, validators, calculations. Fast, no mocks of things you own.
- **Component** — Testing Library. Query by role and label, the way a user finds things. Never by class or test id unless there is no accessible handle (and that itself is an a11y finding).
- **Integration** — a real flow across service + store + component, with the network mocked at the HTTP layer (MSW), not by stubbing your own modules.
- **E2E** — Playwright, for the few flows the business cannot afford to break: auth, the primary create path, payment/submit.

## Rules

- Test behaviour, not implementation. A refactor with unchanged behaviour must not break tests. If it does, the test was wrong.
- One reason to fail per test. Descriptive name stating the rule: `rejects payment exceeding the outstanding balance`.
- Deterministic: fixed clock, seeded data, no sleeps, no shared mutable state between tests.
- Arrange–act–assert, visibly.
- Test the error and empty paths, not only the happy path.
- Mock at boundaries you don't own (network, time, storage). Mocking your own service means the test proves nothing.

## Bug protocol

1. Write the failing test that reproduces it.
2. Find the root cause (`skills/refactoring.md` §Debugging).
3. Fix the cause.
4. Test passes; the rest of the suite still passes.

A bug fixed without a regression test will return.
