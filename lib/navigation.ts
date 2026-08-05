const allowedReturnPaths = [
  /^\/routines(?:\/[0-9a-f-]+)?$/i,
  /^\/workout\/[0-9a-f-]+$/i,
  /^\/history(?:\/[0-9a-f-]+)?$/i,
];

export function safeReturnPath(
  value: string | string[] | undefined,
  fallback = "/exercises",
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !allowedReturnPaths.some((rule) => rule.test(candidate))) {
    return fallback;
  }
  return candidate;
}

export function exerciseDetailHref(slug: string, from?: string) {
  const base = `/exercises/${encodeURIComponent(slug)}`;
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}

export function returnLabel(path: string) {
  if (path.startsWith("/workout/")) return "Volver al entreno";
  if (/^\/routines\//.test(path)) return "Volver a la rutina";
  if (path.startsWith("/history")) return "Volver al historial";
  if (path === "/routines") return "Volver a rutinas";
  return "Volver a la biblioteca";
}
