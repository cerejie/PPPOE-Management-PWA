# Design Language — Glass on Aurora

A design *language*: colour, surface, and elevation. Structure lives in
`design/app-shell.md`; page anatomy in `design/page-composition.md`.

**Intent:** modern premium SaaS — calm, spacious, confident. Not decorated, and
explicitly not a default Ant Design admin template.

| Aim for | Avoid |
|---|---|
| Clear hierarchy, one primary action | Three competing CTAs |
| Generous, consistent spacing | Dense borders separating everything |
| Soft elevation, rounded surfaces | Random shadows, sharp corners |
| Typography carrying hierarchy | Colour carrying hierarchy |
| Motion that explains a change | Motion as decoration |
| Progressive disclosure | Everything visible at once |

---

## The two layers

1. **Aurora backdrop** — a fixed element painting a slow, drifting gradient field
   behind everything. `position: fixed`, its own stacking layer.
2. **Glass panels** — the shell floats above it at `position: relative; z-index: 1`.

The panels are **translucent, not opaque**: the drift must stay legible *through*
them. A panel that hid the backdrop entirely would leave it visible only in the
gutters, which reads as a bug rather than a background.

```ts
const panel = {
  backgroundColor: tokens.color.glassSurface,
  border: `1px solid ${tokens.color.glassBorder}`,
  boxShadow: tokens.elevation.panel,
  backdropFilter: tokens.backdropFilter.glass,
  WebkitBackdropFilter: tokens.backdropFilter.glass,
} as const;
```

Spread this constant into every shell panel. One object is what keeps four
surfaces identical.

### No `@supports` fallback — deliberately

Where `backdrop-filter` is unsupported the panels are simply translucent. Keep
the contour ink low enough that text over an *unblurred* field still clears
contrast, and the degradation stays purely cosmetic. Guarding it would buy
nothing and add a second visual path to maintain.

## Surface hierarchy

| Token | Used for |
|---|---|
| `canvas` | the flat ground colour behind the backdrop |
| `glassSurface` | header, sidebar, bottom nav |
| `glassSurfaceSunken` | the **content panel** |
| `glassBorder` | every panel's 1px contour |

The content panel is *sunken* so that opaque cards inside it still read as cards —
they sit **on** the glass, they are not more of it. Get this wrong and a card on a
panel of the same value disappears.

## Required token contract

A design language must define all of these, or the shell cannot be built from
tokens alone:

```
color:          canvas · glassSurface · glassSurfaceSunken · glassBorder
                text · textSecondary · brand
elevation:      panel · lg
backdropFilter: glass
radius:         xxl (shell panels) + the standard scale
space:          xxs xs sm md lg xl
fontSize / fontWeight / lineHeight / duration / zIndex
layout:         shellGap · sidebarWidth · headerHeight · bottomNavHeight · brandMarkSize
```

`zIndex` needs at least `sidebar`, `header`, `bottomNav`. Note that a token is a
`var()` reference, not a literal — arithmetic on one is `NaN`. Compose with
`calc()` in CSS, never in JS.

## The header gutter mask

`backdrop-filter` is clipped to an element's own border box, so the 16px strip
between the sticky header and the viewport edge cannot be reached by the backdrop.
Scrolled content would otherwise show through it.

```ts
'&::before': {
  content: '""', position: 'absolute', insetInline: 0,
  top: `calc(${tokens.layout.shellGap} * -1)`,
  height: tokens.layout.shellGap,
  backgroundColor: tokens.color.canvas,
}
```

That band is the one strip the aurora does not reach — a flat sliver of canvas.
Extending the drift into it would mean replaying the gradient in a second element
and keeping the two in step, which is not worth what it buys.

## Rules

- **Zero hardcoded values in components.** A `#1677ff`, `13px`, or `margin: 7px`
  is a defect. If a value is missing from the scale, the scale is wrong — fix it.
- Ant Design is the base; adjust via `ConfigProvider` tokens and Vanilla Extract.
  Never rebuild an AntD component to restyle it.
- Spacing follows the 4px scale.
- Max three elevation levels in a view.
- Two font families maximum, one type scale.
- Whitespace separates; borders are a last resort.

## Do not

Generate a generic Ant Design admin layout · use opaque panels (it defeats the
whole language) · put a card of the same value on the content panel · add shadows
that do not signal a layer · animate for decoration.
