# Design — Page Composition

How a page is assembled inside the content panel. Load with `design/app-shell.md`.

The shell owns the page gutter, so **a page adds no outer padding of its own**.

---

## The standard page

```
Page Header          title · description? · primary action · secondary?
↓
Summary Cards        optional — the 3–5 numbers that frame what follows
↓
Content Card
 ├── Toolbar         search → filters → bulk actions → primary action
 └── Primary Content table · grid · form · list
↓
Pagination
```

**Never begin a page with a raw table, form, or list.** A page that opens on a
table gives the user no orientation and no place for the primary action to live.

**Never place a table directly on the page background.** Major content lives in a
card. The card is what separates "the data" from "the page".

## Page header

Title, optional one-line description, one primary action, secondary actions
subordinate. Keep it light — it is orientation, not a control panel.

## Toolbar

Fixed order, every page, so the eye learns it once:

`search → filters → bulk actions (optional) → primary action`

Related controls stay grouped. The primary action sits at the trailing edge.

## Tables

**Desktop** — sticky header · comfortable row height · soft hover · minimal
borders · status as a badge · secondary row actions behind an overflow menu.

Avoid: cramped rows, more than one visible row action, horizontal scrolling.

> Density is a desktop feature (`profiles/desktop-first.md`), but "dense" means
> *more rows visible*, never *smaller touch targets and 11px text*.

**Mobile** — `search → filter → cards → pagination / load more`, using the
table→card recipe in `profiles/mobile-first.md`.

## Cards

Cards are layout containers: generous padding, rounded corners, soft border,
restrained elevation. **Avoid nesting cards inside cards** — if content needs its
own card, it probably needs its own section or page. Two levels is the limit, and
the second needs a reason.

When the content panel is itself a surface, cards inside it must read as *on* it,
not *more of* it — that is a job for the design language's sunken/raised
distinction.

## Forms

`section → fields → actions`. Group long forms into sections; never a wall of
inputs. Field order follows the user's mental model, not column order.

## Detail pages

`header → summary → information → history/activity → notes`

Summary before detail, always. The user should be able to stop reading after the
summary and still know the state of the thing.

## Drawers vs modals

| | Use for | Never |
|---|---|---|
| **Drawer** | quick edit, preview, small form, details | complex multi-step workflows |
| **Modal** | confirmation, delete, warning, small form | a full CRUD page |

If it needs its own toolbar or more than one section, it is a page.

## Every surface defines

loading (skeleton shaped like the content) · empty (**says what to do next**, not
"no data") · error (cause + retry) · offline (when supported) · unauthorised ·
long values (truncate, full value available) · slow network.

## Motion

150–250ms. Fade, slide, scale, colour. No bounce, elastic, or flashing. Motion
explains a change; it is not decoration. Honour `prefers-reduced-motion`.

## Final check

- [ ] Header first, summary before details
- [ ] Toolbar above content, in the fixed order
- [ ] Table inside a card, never on the background
- [ ] Exactly one primary action
- [ ] Cards not nested more than two deep
- [ ] Whitespace doing the separating, not borders
- [ ] All five states defined
