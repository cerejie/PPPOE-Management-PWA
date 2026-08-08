# Design — App Shell (sidebar · header · content · bottom nav)

The layout architecture for a desktop-first admin/SaaS product. Derived from a
shipped implementation, including the parts that only surface once it is running.

Load with `profiles/desktop-first.md` and the active design language
(`design/languages/*.md`), which owns colour, elevation, and surface treatment.
This file owns **structure**.

---

## 1. The shape

**Full-width header on top. Sidebar hangs below it. Content takes the rest.**

```
┌──────────────────────────────────────────────┐
│ HEADER   brand ······················ actions │  full width, sticky
├───────────────┬──────────────────────────────┤
│ SIDEBAR       │ CONTENT                      │
│  Menu         │                              │
│  ·            │                              │
│  (spacer)     │                              │
│  General      │                              │
└───────────────┴──────────────────────────────┘
```

Not a full-height sidebar with the header beside it. The header spans the page
and is the **only** place the wordmark lives; the sidebar starts underneath it.
This keeps one horizontal band for identity and account actions, and gives the
sidebar a clean top edge that aligns with the content.

## 2. Panels, not chrome

The shell is a set of **detached panels floating on a canvas**, not edge-to-edge
chrome. Header, sidebar, content, and mobile bar are each a rounded surface
separated by one `shellGap`.

```
shell:  padding: shellGap;  gap: shellGap;  min-height: 100dvh
```

Consequences that are easy to miss:

- The shell background is **transparent**, not the canvas colour — a backdrop
  layer paints underneath and the panels float over it.
- Content padding belongs to the **content panel**, so a page adds none of its own.
  Every page then starts at the same inset without repeating it.
- Each panel carries the same `radius.xxl`. One radius across the shell is what
  makes it read as a system rather than three separate widgets.

## 3. Layout tokens

Never inline these. The sidebar width appearing in both a stylesheet and a
component is the single most common drift in a shell.

| Token | Value | Notes |
|---|---|---|
| `layout.shellGap` | `16px` | the one gutter — padding *and* gap |
| `layout.sidebarWidth` | `288px` | wide enough for icon + label + group headings |
| `layout.headerHeight` | `76px` | drives the sidebar's sticky offset |
| `layout.bottomNavHeight` | `60px` | drives the mobile content clearance |
| `layout.brandMarkSize` | `44px` | |
| `radius.xxl` | — | every shell panel |

## 4. Sticky geometry — get this exact

The sidebar sticks **below the header**, not to the viewport top:

```
sidebar:
  position: sticky
  top:    calc(headerHeight + shellGap * 2)
  height: calc(100dvh - headerHeight - shellGap * 3)
```

The gap multipliers are not arbitrary: `* 2` clears the shell's top padding plus
the gap under the header; `* 3` additionally clears the bottom padding. Change
`shellGap` and both stay correct — which is the reason they are expressions
rather than a measured constant.

```
header:  position: sticky;  top: shellGap;  z-index: header
body:    display: flex;  flex: 1;  min-width: 0;  gap: shellGap
content: flex: 1;  min-width: 0
```

**`min-width: 0` on both `body` and `content` is load-bearing.** Without it a wide
table stretches the flex row instead of scrolling inside its own panel, and the
whole page gains a horizontal scrollbar. This is the most common shell bug.

## 5. Mobile is a different tree, not a shrunken one

```tsx
const screens = Grid.useBreakpoint();
const isMobile = !screens.md;
if (isMobile) return <MobileTree/>;
return <DesktopTree/>;
```

Two render trees, branched in JS — **not** one tree with CSS hiding the other.
Sidebar and bottom navigation are genuinely different navigation patterns, and
rendering both and hiding one ships dead DOM, duplicate focus targets, and two
menus for a screen reader to find.

Mobile tree: header (carrying the **active page title** instead of the wordmark) →
content → fixed bottom nav.

```
bottomNav:
  position: fixed
  inset-inline: shellGap
  bottom: calc(shellGap + env(safe-area-inset-bottom))
  display: grid;  grid-auto-flow: column;  grid-auto-columns: 1fr
```

A floating, inset, rounded bar — matching the panel language — not an edge-to-edge
tab strip.

**Clearance for it is a `margin-bottom` on the content panel, never padding:**

```
content @mobile:
  margin-bottom: calc(bottomNavHeight + shellGap + env(safe-area-inset-bottom))
```

Padding would leave the panel running underneath the bar; the card must *end*
above it. With padding you see the panel's surface through the gap around the
floating bar, which looks like a rendering error.

## 6. Sidebar composition

```
aside (flex column, overflow-y auto)
├── Menu   group "Menu"      — primary destinations
└── sidebarFooter (margin-top: auto)
    └── Menu group "General" — settings, secondary
```

`margin-top: auto` pins the secondary group to the bottom without a spacer element
or a fixed height.

**Use a plain `<aside>`, not AntD's `Sider`.** With no collapsing to do, `Sider`
contributes only an inline width that must be kept in step with the token by hand.
The width then comes from the token alone.

**Do not add collapse by default.** It costs a stored preference, a toggle
control, and a second set of sizes to maintain forever. Under ~8 destinations
there is nothing to hide. Add it when a real navigation count forces it, and
record the decision.

## 7. Cross-boundary slot

```tsx
interface AppShellProps {
  readonly children: ReactNode;
  /** Rendered at the end of the header. A slot, not an import, because
   *  components/ may not reach into features/. */
  readonly accountSlot?: ReactNode;
  readonly isNavigationItemVisible?: (item: NavigationItem) => boolean;
}
```

The shell lives in shared component space and must not import a feature. The
account menu is passed **in** as a slot. Permission filtering is likewise a
predicate the caller supplies — the shell never learns what a role is.

This is the dependency-direction rule (`core/skills/architecture.md`) applied to
the one component most tempted to violate it.

## 8. Fighting AntD's runtime injection

AntD writes `colorBgLayout` / `headerBg` onto `.ant-layout` and
`.ant-layout-header` **at runtime, after** your stylesheet loads. A single-class
rule loses the specificity tie and repaints the panel opaque.

```ts
selectors: {
  '&&': { backgroundColor: 'transparent' },   // doubled, deliberately
}
```

Related, in the sidebar: AntD paints the `Menu` and every resting item with
`colorBgContainer`, tiling an opaque sheet over the panel. Clear it — and exclude
the **selected** item by class, not by source order, because AntD's selected and
hover rules land at equal or higher specificity and a tie would be settled by
injection order:

```ts
globalStyle(`${sidebar} .ant-menu, ${sidebar} .ant-menu-item:not(.ant-menu-item-selected)`,
  { backgroundColor: 'transparent' });
globalStyle(`${sidebar} .ant-menu-inline`, { borderInlineEnd: 'none' });
```

Scope these to the sidebar, not to the global theme — they are facts about this
surface, not about every `Menu` in the product.

## 9. Print

Chrome carries `data-print-hidden`. The content panel drops its surface entirely
in `@media print` — no border, radius, shadow, backdrop-filter, or padding.
**A printed page is paper, not a panel floating on a canvas.** Desktop products
get printed; treating it as an afterthought produces pages with a grey card and a
navigation sidebar on them.

## 10. Checklist

- [ ] Header full width and sticky; sidebar sticks *below* it with the calc offsets
- [ ] `min-width: 0` on both `body` and `content`
- [ ] Mobile and desktop are separate render trees
- [ ] Bottom-nav clearance is `margin-bottom`, includes `env(safe-area-inset-bottom)`
- [ ] Sidebar width, header height, gap all from tokens — no inline duplicates
- [ ] `&&` used where AntD injects a background at runtime
- [ ] Shell imports no feature; account UI arrives via slot
- [ ] Chrome hidden in print; content prints as paper
