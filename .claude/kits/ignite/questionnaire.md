# Ignite — Interview

Ask these before writing a single file. Answers go to `memory/product-principles.md`
and `memory/conventions.md`. Ask in one batch; do not interrogate one at a time.

Where the user has no opinion, state the default you are taking and move on. Where
the answer is a **business rule**, never guess.

---

**1. What is this, in one sentence, and who uses it?**
Roles matter more than features — they decide the permission model.

**2. What are the modules?**
Business nouns that own their own writes. 4–8 is typical. A noun that never gets
written independently is not a module — it belongs to its parent.

**3. Which backend?** → picks the adapter
`supabase` · `dotnet-rest` · `node-rest` · other (write a new adapter doc first).

**4. Must it work offline?** → picks `profiles/offline-sync`
Follow up, because this is the expensive question:
- Read-only offline, queued writes, or online-only? **Per surface.**
- Which single feature *must* work with no network? That one decides the design.

**5. Is it installed on a phone?** → picks `profiles/pwa`
Installed PWA, mobile web, or desktop-first?

**6. What is the money/identity-critical operation?**
The one that must never double-apply, never be lost, and always be auditable. It
sets idempotency and audit requirements for the whole app.

**7. Multi-tenant?**
If yes, tenant scoping goes into every query and every policy from the first
table — retrofitting it is a rewrite.

**8. What is explicitly out of scope for v1?**
Straight to `roadmap/BACKLOG.md`. Prevents speculative scaffolding.

---

## Then confirm, and wait

> Modules: **…** · Adapter: **…** · Profiles: **…** · Conformance target: **L5**
> Reference module for scaffolding: **…**

Get an explicit yes before step 3. Scaffolding is cheap to write and expensive to
unwind once code depends on it.
