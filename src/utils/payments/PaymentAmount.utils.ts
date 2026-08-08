/**
 * Keeps the amount field usable mid-typing: digits, one leading minus (a
 * correction is a negative row) and at most one decimal point with two places.
 * Nothing is padded here — the cents only appear on blur.
 */
export function sanitiseAmountInput(raw: string): string {
  const negative = raw.trimStart().startsWith('-');
  const [whole = '', ...rest] = raw.replace(/[^\d.]/g, '').split('.');
  const decimals = rest.join('').slice(0, 2);
  const body = rest.length > 0 ? `${whole}.${decimals}` : whole;
  return negative ? `-${body}` : body;
}

/** "1500" -> "1500.00" once the operator leaves the field. */
export function formatAmountOnBlur(raw: string): string {
  const value = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(value)) return raw;
  return value.toFixed(2);
}
