# Memory — Project Conventions

Project-specific decisions that are **not derivable** from the code. Load this whenever touching existing app code.

Keep entries short. Delete what stops being true. Anything the code already states plainly does not belong here.

---

## Domain vocabulary

One word per concept, used identically in UI, service, schema, database, and conversation.

| Term | Means | Not |
|---|---|---|
| _(pending product overview)_ | | |

---

## Established patterns

Decisions settled during implementation that future work must follow.

| Area | Convention | Since |
|---|---|---|
| Package manager | Yarn only | 2026-08-06 |
| Page vertical rhythm | `Screen` pads its body but sets **no `gap`** — every block stacked above the list owns the space beneath it. 0.75rem after the search box, 1rem after a filter or action bar. A shared component (`SearchInput`) gets a wrapper class in the page stylesheet; a module-only widget carries its own `marginBottom`. | 2026-08-08 |
| Chip filter rows | Compose `bar` from `styles/common/buttons/FilterChip.css` and add `margin: '0 -1rem 1rem'` + 1rem side padding, so the row bleeds over the screen gutter and scrolls edge to edge. Never re-declare the flex/overflow rules. | 2026-08-08 |
| _(more as they are settled)_ | | |

---

## Business rules that are not obvious from the code

| Rule | Source | Where enforced |
|---|---|---|
| _(pending product overview)_ | | |

---

## Known gotchas

Integration quirks, third-party behaviour, environment traps.

| Gotcha | Impact | Workaround |
|---|---|---|
| A new page looks fine in isolation but stacks flush | `Screen` has no `gap`, so forgetting the per-block margins is invisible until the screen has three or more blocks above the list — it reads as "the design broke", not "a rule was missed" | Copy the rhythm from `styles/pages/clients/ClientsPage.css.ts` or `.../rooms/RoomsPage.css.ts` when adding any screen with a search box or filter bar |
| Supabase dashboard SQL editor does not stop at the first error | A failed migration leaves a partial schema, and statements after the failure still run — including anything meant to undo a temporary state | Paste `begin;` / `commit;` around any multi-statement script run in the dashboard. `supabase db push` is already transactional |
