# Standard — UI, UX & Accessibility (checkable rules)

The *how* and the design intent live in `skills/uiux.md`.

## Tokens

- Colour, spacing, radius, elevation, typography, z-index come from the theme contract. Zero hardcoded values in components.
- Spacing follows the scale (4px base). No arbitrary `7px`.
- Maximum two font families, one type scale.
- Elevation used to signal layer, not decoration. Maximum three levels in a view.

## Layout

- One primary action per view; secondary actions visually subordinate.
- Consistent page shell: title, optional description, actions, content — same order everywhere.
- Content max-width on text-heavy views (~72ch) so lines stay readable.
- Consistent vertical rhythm between sections; no ad-hoc margins.

## Responsive

- Breakpoints: mobile `<768`, tablet `768–1199`, desktop `≥1200`. Defined once in the theme.
- **No horizontal scroll below 768px** on any primary workflow.
- Tables below 768px use cards, summary rows, or a drawer detail — never a shrunken table with hidden columns and no alternative.
- Tap targets ≥44×44px with ≥8px separation.
- Primary mobile action reachable in the lower third of the screen.
- Safe-area insets respected on standalone/PWA display.
- Modals become full-screen or bottom sheets on mobile.

## States

Every data surface implements: **loading** (skeleton matching content shape) · **empty** (explains the next action) · **error** (cause + retry) · **offline** (when the surface supports it) · **unauthorised**.

No infinite spinner without a timeout path. No silent failure.

## Feedback

- Destructive actions confirm, name the thing being destroyed, and label the button with the verb (`Delete invoice`, not `OK`).
- Long operations show progress or an explicit pending state; the trigger disables while pending.
- Success feedback is proportionate: inline for small changes, toast for background ones, never a modal for a save.

## Forms

- Every input has a visible label. Placeholder is never the label.
- Errors appear next to the field, in text, and are announced.
- Required fields marked consistently.
- Field order matches the user's mental model, not the database column order.
- Mobile: correct `inputmode`/`type` so the right keyboard appears.

## Accessibility (minimum)

- Semantic HTML; landmarks present; one `h1` per page and no skipped heading levels.
- Fully keyboard operable; focus order logical; focus visible; no keyboard traps outside modals.
- Modals trap focus, close on `Esc`, and restore focus to the trigger.
- Contrast ≥4.5:1 body text, ≥3:1 large text and meaningful UI boundaries.
- Information never conveyed by colour alone.
- Images have alt text; decorative images have empty alt.
- `prefers-reduced-motion` honoured.
- Dynamic content changes announced via a live region where the user would otherwise miss them.

## Forbidden

Rebuilding an AntD component to restyle it · shrunken desktop tables on mobile · placeholder-as-label · colour-only status · nested scroll regions · more than one primary button in a view · disabled buttons with no explanation of why.
