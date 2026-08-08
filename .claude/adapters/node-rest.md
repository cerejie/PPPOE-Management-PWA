# Adapter — Node REST (Express / Fastify / Nest)

Load with `adapters/_ports.md`. Implements the ports in `src/api/adapters/node/`.

```
capabilities: { realtime: false, files: true, rls: false }
```

| Question | Node REST |
|---|---|
| Auth model | JWT bearer, or httpOnly session cookie (preferred for same-site) |
| Authorization enforced at | **the service layer** — no RLS |
| Idempotency | `Idempotency-Key` header + server dedupe table |
| Concurrency | `ETag`/`If-Match`, or a version column in the payload |
| Migrations | Prisma Migrate / Knex / TypeORM |
| Server logic | the service layer |

## Error mapping

Identical to `dotnet-rest.md` — the status-code contract is the same. Map the
framework's validation error shape (Zod `flatten()`, `class-validator`,
`express-validator`) onto `BackendError.fieldErrors`.

## Notes

- **Share the Zod schemas** between client and server via a workspace package.
  This is the one genuine advantage over a .NET backend — take it. One schema,
  parsed on both sides, and contract drift becomes impossible.
- Cookie auth needs CSRF protection on every state-changing request.
- Do not leak the ORM's error objects past the adapter; Prisma error codes are
  as backend-specific as Postgres SQLSTATEs.
- Money as integer minor units or a string. JS numbers lose precision, and the
  server sharing a language does not change that.
