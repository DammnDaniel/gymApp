const NUMBERED_DAY_RE = /^d[ií]a\s+\d+\s*(?:[—–-]\s*)?/iu;

/**
 * Keeps the visible/stored day number aligned with its current position.
 * Names without a numbered prefix (for example, optional cardio) are left
 * untouched.
 */
export function syncRoutineDayName(name: string, position: number): string {
  const trimmed = name.trim();
  if (!NUMBERED_DAY_RE.test(trimmed)) return trimmed;

  const title = trimmed.replace(NUMBERED_DAY_RE, "").trim();
  return title ? `Día ${position + 1} — ${title}` : `Día ${position + 1}`;
}
