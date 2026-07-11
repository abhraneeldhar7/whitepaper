export function stripMarkdown(text: string | undefined | null): string {
  const raw = String(text || "");
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1 ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


export function isPlaceholderHref(href: string | undefined | null): boolean {
  return String(href || "").trim() === "#";
}

export function isAbsoluteUrl(value: string | undefined | null): boolean {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function isInternalHref(candidate: string | undefined | null, siteUrl: string): boolean {
  const value = String(candidate || "").trim();
  if (!value) return false;
  if (value.startsWith("/") || value.startsWith("#")) return true;
  if (!isAbsoluteUrl(value)) return false;

  try {
    const target = new URL(value);
    const site = new URL(siteUrl);
    return target.origin === site.origin;
  } catch {
    return false;
  }
}

