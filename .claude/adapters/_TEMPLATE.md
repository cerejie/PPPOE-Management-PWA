# Adapter — <name>

Load with `adapters/_ports.md`. Implements the ports in `src/api/adapters/<name>/`.

```
capabilities: { realtime: <bool>, files: <bool>, rls: <bool> }
```

## Questionnaire

| Question | Answer |
|---|---|
| Auth model | |
| **Authorization enforced at** | |
| Idempotency mechanism | |
| Concurrency mechanism | |
| Migrations | |
| Server-side logic lives in | |

## Error mapping — required, and the highest-risk table here

Map every failure this backend can produce onto `BackendError.kind`.

| Backend failure | `kind` |
|---|---|
| network / timeout / 5xx / rate limit | `transient` |
| validation | `rejected` |
| **permission denial** | **`rejected`** — never `transient` |
| stale version | `conflict` |
| bad or expired token | `unauthorized` |
| missing / invisible | `notFound` |

A permission denial classified as `transient` retries forever and never reaches the
user. This is the single most damaging adapter bug; the port conformance suite
must assert it.

## Field errors

How does this backend report per-field validation failures, and how do they map to
`BackendError.fieldErrors` so forms can `setError` per field?

## Gotchas

Serialization traps (dates, decimals, casing) · what the SDK does and does not
retry · anything that behaves differently offline.

## Not behind the port

Migrations, policies, triggers, server functions. Describe them here; never
abstract them. Pretending they are portable is how the abstraction starts lying.
