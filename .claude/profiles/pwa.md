# Profile — PWA / Installed App

Opt-in. Load with `core/skills/platform.md`.

**This profile is about installability and runtime, not form factor.** A
desktop-first web app can be installable too. Pair it with exactly one of
`profiles/mobile-first.md` or `profiles/desktop-first.md`, which own layout and
input decisions.

The §Viewport and §Touch sections below apply **only when the app is installed on
a phone**. Skip them for a desktop-installed PWA.

## Install

Manifest with name, short_name, 192/512 icons **plus a maskable variant**,
theme colour, `display: standalone`, and a start URL that survives deep-linking.
SPA fallback configured so every route works on refresh.

## Service worker

- App shell precached. Static assets cache-first; API network-first with a cached
  fallback — **unless a local mirror exists**, in which case do not runtime-cache
  the API at all. Two caches fight and the stale one wins unpredictably.
- **Never cache authenticated responses** in the SW unless the cache is
  partitioned per user and cleared on sign-out.
- A waiting worker must not strand the user on a half-updated app: prompt, then
  `skipWaiting`.

## Viewport — the installed-iOS traps  *(phone-installed only)*

These cost real debugging time; they are here so they cost it once.

- The app shell owns viewport height: one `height: 100dvh` flex column. Inner
  screens use `min-height: 100%`, never their own viewport unit.
- **Never make the tab bar `position: fixed`.** It must be the last row of that
  flex column. As a fixed element it drifts on an installed iOS PWA, where
  `env(safe-area-inset-bottom)` settles only after a re-layout.
- Respect `env(safe-area-inset-*)` on the shell, not on individual components.
- Inputs at `font-size: 16px` minimum, or iOS zooms on focus.
- Test **installed**, not just in a mobile browser tab. The two differ exactly
  where it hurts.

## Touch  *(phone-installed only)*

Targets ≥44px with real spacing. Primary action in thumb reach — bottom sheets
over top-anchored modals. Never rely on hover to reveal an action.

## Desktop-installed

An installed desktop PWA has no browser chrome: no address bar, no back button.

- Provide **in-app back/forward affordances** on any nested flow. Users lose the
  browser's.
- Window can be resized to anything, including very narrow. The responsive rules
  still apply — an installed desktop app is not a fixed-width app.
- Respect `display-mode: standalone` in CSS if the layout should differ.
- Keyboard shortcuts matter more here, not less (`profiles/desktop-first.md`).

## States

Offline is a first-class state on **every** surface, not a global banner.
Show what is stale, what is queued, and what failed — see `profiles/offline-sync.md`.
