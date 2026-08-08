# Skill — Backend

Use when: designing or changing an API, service, job, or anything server-side.
Pairs with `skills/data.md` (schemas, persistence) and `skills/security.md`.

## Layering

```
handler/route  →  service (business rules)  →  repository/data access  →  db
      ↑ validates input          ↑ owns transactions        ↑ owns queries
```

- Handlers do transport only: parse, authorise, delegate, shape response.
- Services own business rules and transaction boundaries. They are the only place a rule lives.
- Repositories own queries. No business branching inside a query layer.
- Infrastructure (mail, storage, queues) sits behind an interface the service depends on.

## Every endpoint checklist

1. **Authenticated?** Who is the caller.
2. **Authorised?** Not just "logged in" — may *this* actor touch *this* record. Check at the data layer, not only the route.
3. **Validated?** Zod at the boundary, before anything else runs. Reject unknown fields on writes.
4. **Idempotent?** Any create/charge/submit accepts an idempotency key and returns the original result on replay.
5. **Transactional?** Multi-write operations are all-or-nothing.
6. **Concurrency-safe?** Optimistic concurrency via version/`updated_at`; return a conflict rather than silently overwriting.
7. **Errors shaped?** Consistent envelope, no internals leaked.
8. **Observable?** Log the decision, actor, and correlation id — never payload secrets.
9. **Bounded?** Pagination has a hard max. No unbounded list endpoints.

## Response contract

Success and failure both use a stable envelope. Errors carry a machine-readable `code`, a human `message` safe to display, and optional per-field `details`. Never return stack traces, SQL, provider messages, or internal ids the client has no right to.

Status codes mean what they mean: `400` malformed, `401` unauthenticated, `403` unauthorised, `404` absent *or* not visible to this actor, `409` conflict, `422` valid shape but broken business rule, `429` rate limited.

## Failure design

Assume every dependency fails. For each external call decide: timeout, retry policy (only for idempotent calls), backoff, and what the user sees when it stays broken. Partial failure must not leave half-written state. Never swallow an exception — handle it or let it propagate to a boundary that will.

## Reads

Deliberate about N+1: batch or join, never loop-fetch. Select the columns needed. Index anything filtered, joined, or sorted on. Cache only with an explicit invalidation story (`skills/platform.md`).

## Writes

Validate → authorise → load current state → apply rule → persist → emit side effects. Side effects (email, webhook, push) go **after** commit, and are retryable independently. Never let a failed notification roll back a valid write.

## Audit

Anything money-, permission-, or identity-related records: who, what, when, before, after. Audit rows are append-only.
