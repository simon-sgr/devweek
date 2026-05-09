const allowedSchemes = ["http:", "https:", "mailto:", "tel:"];

export function isSafeExternalLink(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return allowedSchemes.includes(parsed.protocol);
  } catch {
    return false;
  }
}
