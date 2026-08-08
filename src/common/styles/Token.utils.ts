import { vars } from '@/common/styles/Theme.css';

/**
 * Helpers for reading the theme contract.
 *
 * These live outside `Theme.css.ts` because a Vanilla Extract `.css.ts` module
 * may only export serialisable values — the compiler evaluates it at build time
 * and cannot carry a function into the bundle.
 *
 * Colour tokens are stored as bare `R G B` triples so an alpha can be applied at
 * the point of use without a second token for every opacity the design needs. A
 * triple is not a colour on its own; always wrap it in one of these.
 */

/** Finished colour from a triple token. */
export const solid = (triple: string): string => `rgb(${triple})`;

/** Finished colour from a triple token at a given alpha. */
export const alpha = (triple: string, a: number): string => `rgb(${triple} / ${a})`;

/** The brand gradient, used by primary buttons and accent surfaces. */
export const accentGradient = `linear-gradient(135deg, ${solid(vars.rgb.accent)} 0%, ${solid(
  vars.rgb.accent2,
)} 100%)`;
