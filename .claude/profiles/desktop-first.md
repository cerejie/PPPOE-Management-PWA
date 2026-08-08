# Profile — Desktop-First Web App

**Primary target: desktop. Secondary: mobile.** Mobile must still work — it is
never allowed to be broken — but the desktop layout is the one designed first and
optimised hardest.

Pairs with `core/skills/uiux.md` and `core/standards/ui.md`, which are
form-factor neutral. This profile decides which end of their breakpoint table you
design from.

Mutually exclusive with `profiles/mobile-first.md`. Combine freely with
`profiles/pwa.md` (installability) and `profiles/offline-sync.md`.

---

## What changes versus mobile-first

| | Desktop-first |
|---|---|
| Design order | Desktop → tablet → mobile |
| **Density** | **A feature, not a smell.** Users compare rows and scan columns. |
| Tables | Stay tables. Sorting, resizing, sticky headers, column visibility. |
| Navigation | Persistent sidebar. Bottom tab bars are a mobile-only fallback. |
| Primary input | **Keyboard and mouse**, not thumb. |
| Detail views | Side panel or split view — keep context visible. |
| Hover | A legitimate affordance. |
| Review width | 1440px first, then 1024, then 375. |

## Density is the point

Do not import mobile spaciousness onto desktop. A 1440px screen showing 8 rows is
a wasted screen. Aim for 20–40 rows visible, comfortable line height, and real
column alignment.

The AntD `size="middle"`/`"small"` table variants exist for this. Offer a density
toggle on any table users live in all day.

## Keyboard is a first-class input

On desktop this is not accessibility garnish — it is the power-user path, and
skipping it is the most common failure of a "responsive" app built mobile-first.

- Logical tab order through every form, in visual order.
- `Enter` submits, `Esc` cancels and closes, everywhere, without exception.
- Shortcuts for the top 3–5 actions, discoverable via a `?` overlay.
- Tables: arrow-key row navigation, `Space` to select, `Shift`+click for ranges.
- Search focus on `/` or `Ctrl/Cmd+K` where search is central.
- Never trap focus outside a modal.

## Layout

- **Cap the content width.** Unbounded layouts on a 3440px ultrawide are unreadable.
  Data tables may go full-width; text and forms cap around 72ch–1440px.
- Multi-column detail views: label/value grids, not stacked mobile rows.
- Side panel over modal for edit flows — context stays visible.
- Persistent sidebar navigation, collapsible to icons. Bottom nav only below 768px.
- Resizing is **continuous**, not three fixed states. Test the awkward widths
  (900px, 1100px) where a sidebar and a table are fighting.

## Mouse affordances desktop may use, and mobile may not

Hover states and hover-revealed row actions · right-click context menus (with a
visible equivalent — never the only path) · drag and drop for reordering (with a
keyboard equivalent) · tooltips on icon-only buttons (**required**, not optional)
· multi-select with `Shift`/`Ctrl`.

**Every hover-only affordance needs a non-hover path**, or it vanishes on touch.
This is the single most common desktop-first bug that reaches mobile users.

## Mobile is secondary, not broken

Below 768px the standards in `core/standards/ui.md` §Responsive still apply in
full. Secondary means *designed second*, never *skipped*:

- Tables become cards or summary rows — the recipe in `core/skills/uiux.md`
  §Table → mobile conversion still applies.
- Sidebar becomes a drawer.
- Side panels become full-screen routes.
- Tap targets ≥44px, and **hover-only actions get a visible button**.
- No horizontal scroll on a primary workflow.

## Things desktop-first still owes the user

- Print / export where the data is reporting-shaped. Desktop users expect it.
- Deep links to every view — desktop users bookmark and share URLs.
- Multi-tab safety: two tabs open on the same record must not silently clobber
  (`core/skills/backend.md` §concurrency).
- Browser back/forward correctness. URL-representable state lives in search params.

## Review checklist (replaces the mobile-first one)

- [ ] Checked at **1440px**, **1024px**, and **375px**
- [ ] Checked at an awkward mid width (~900px)
- [ ] Fully keyboard operable; `Enter`/`Esc` behave; focus visible
- [ ] No hover-only affordance without a non-hover path
- [ ] Content width capped; ultrawide does not stretch text
- [ ] Table has a real mobile pattern below 768px
- [ ] Loading, empty, error, unauthorised states at both ends
