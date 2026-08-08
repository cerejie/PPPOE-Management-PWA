# Skill — UI/UX (design system, responsiveness, mobile/PWA design)

Use when: designing any user-facing surface. Design before coding.
Runtime side of PWA (caching, install, offline) lives in `skills/platform.md`.

## Design intent

The product should read as **modern, premium, enterprise-grade** — calm, spacious, confident. Not decorated.

Aim for | Avoid
---|---
Clear hierarchy, one primary action per view | Three competing CTAs
Generous, consistent spacing | Dense borders separating everything
Depth through elevation tokens, used sparingly | Random shadows
Typography carrying the hierarchy | Colour carrying the hierarchy
Motion that explains a change | Motion as decoration
Progressive disclosure | Everything visible at once

Ant Design is the base. Adjust through theme tokens and Vanilla Extract so it feels intentional rather than default — but never rebuild an AntD component to change its look.

## Design tokens

Spacing, radius, colour, elevation, and type scale come from the theme. A hardcoded `#1677ff`, `13px`, or `margin: 7px` in a component is a defect. If a value is missing from the scale, the scale is wrong — fix the scale.

## Responsive is adaptation, not scaling

| Breakpoint | Behaviour |
|---|---|
| **Desktop ≥1200** | Dense layouts, tables, side panels, persistent sidebar, multi-column detail |
| **Tablet 768–1199** | Reduced density, collapsible nav, two-column max, tables keep only priority columns |
| **Mobile <768** | Mobile-native patterns. Not a shrunken desktop |

### Mobile rules
- **No horizontal scrolling** in any primary workflow.
- Tables become cards, list rows with a summary line, or descriptions inside a drawer. Pick one per surface and stay consistent.
- Show a **summary first**; details reveal progressively via drawer, accordion, or a detail route.
- Primary actions within thumb reach — bottom bar or sticky footer, not a top-right button.
- Tap targets ≥44px with real spacing between them.
- Bottom navigation for ≤5 top-level destinations; drawer beyond that.
- Filters go in a bottom sheet with an applied-count badge — never a cramped inline row.
- Respect safe areas (`env(safe-area-inset-*)`).
- List → detail transitions feel like navigation, not a modal stack.

If a surface will be used mostly on mobile, **design mobile first or alongside desktop — never after.**

## Table → mobile conversion recipe

1. Identify the 1 primary identifier, 2 supporting facts, 1 status, 1 primary action.
2. Card front shows exactly those.
3. Everything else lives in the detail view.
4. Sorting and filtering move into a sheet.
5. Bulk actions become a selection mode, not row checkboxes.

## Every surface specifies

loading (skeleton shaped like the content) · empty (says what to do next) · error (cause + retry) · offline · unauthorised · long values (truncate with full value available) · slow network

## Accessibility (minimum, not aspiration)

Semantic elements. Keyboard reachable and visibly focused. Labels tied to inputs. Errors announced and text-described, never colour-only. Contrast ≥4.5:1 for body text. Modals trap focus and restore it on close. Motion respects `prefers-reduced-motion`.

## Before writing UI code, state

1. What is the user trying to finish here?
2. What is the one primary action?
3. What can be hidden until asked for?
4. What does this look like on a 375px screen?
5. What happens when it is empty, slow, offline, or broken?
