# Profile — Mobile-First App

**Primary target: mobile. Secondary: desktop.** Designed for a phone in one hand;
desktop is a widened version, not the reference layout.

Pairs with `core/skills/uiux.md` and `core/standards/ui.md`, which are
form-factor neutral. This profile decides which end of their breakpoint table you
design from.

Mutually exclusive with `profiles/desktop-first.md`. Combine with
`profiles/pwa.md` when the app is installed, and `profiles/offline-sync.md` when
it works offline.

---

## Design order

Mobile → tablet → desktop. **Never design desktop and shrink it.** A shrunken
desktop layout is detectable instantly: it has a table with a horizontal scrollbar,
a top-right primary button, and 11px text.

## Rules

- **No horizontal scrolling** in any primary workflow. Not one.
- Tables become cards, summary rows, or a drawer detail. Pick one per surface and
  stay consistent across the app — mixing them is worse than picking the weaker one.
- Summary first; details reveal progressively via sheet, accordion, or detail route.
- **Primary action in the lower third** — bottom bar or sticky footer. A top-right
  primary button is a desktop habit and unreachable one-handed.
- Tap targets ≥44px with ≥8px separation.
- Bottom navigation for ≤5 top-level destinations; drawer beyond that.
- Filters in a bottom sheet with an applied-count badge, never a cramped inline row.
- Modals are full-screen or bottom sheets.
- Inputs carry the right `inputmode`/`type` so the correct keyboard appears.
- **Never rely on hover** — it does not exist. Every action is a visible control.
- List → detail feels like navigation, not a stacked modal.

## Table → card recipe

1. Identify: 1 primary identifier, 2 supporting facts, 1 status, 1 primary action.
2. The card front shows exactly those five things.
3. Everything else lives in the detail view.
4. Sorting and filtering move into a sheet.
5. Bulk actions become a selection mode, not row checkboxes.

## Desktop is secondary, not ignored

Above 1200px, a mobile-first app must not become a 400px column floating in grey.

- Widen to a comfortable content column; use the space for a two-column detail or
  a persistent sidebar.
- Bottom tab bar becomes a sidebar.
- Bottom sheets become centred modals or side panels.
- Keyboard operability is still required (`core/standards/ui.md` §Accessibility).

## Review checklist

- [ ] Checked at **375px** first, then 768, then desktop
- [ ] No horizontal scroll anywhere in a primary workflow
- [ ] Primary action reachable by thumb
- [ ] No hover-dependent affordance
- [ ] Tap targets ≥44px
- [ ] Desktop width does not look like a stretched phone
- [ ] Loading, empty, error, offline states at both ends
