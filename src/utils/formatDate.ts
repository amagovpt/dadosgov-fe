import { formatDistanceToNow } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import type { Locale } from "date-fns";

const DATE_FNS_LOCALES: Record<"pt" | "en", Locale> = { pt, en: enGB };

// date-fns fuzzy prefixes to strip so the distance reads cleanly, for both locales.
const FUZZY_PREFIXES = [
  // pt
  "aproximadamente ",
  "quase ",
  "menos de ",
  "cerca de ",
  // en
  "about ",
  "over ",
  "almost ",
  "less than ",
];

export function formatDateToTimeAgo(
  date: string | undefined | null,
  // PT default is an intentional fallback; migrated callers pass a translated string.
  locale: "pt" | "en" = "pt"
) {
  const unknown = locale === "pt" ? "Desconhecido" : "Unknown";
  if (!date) return unknown;
  const parsed = new Date(date);
  // A non-empty string that is not a date reaches date-fns and throws
  // `RangeError: Invalid time value`, taking the whole render down. Guarding
  // only the empty case was never enough.
  if (Number.isNaN(parsed.getTime())) return unknown;
  const distance = formatDistanceToNow(parsed, { locale: DATE_FNS_LOCALES[locale] });
  return FUZZY_PREFIXES.reduce((acc, prefix) => acc.replace(prefix, ""), distance);
}

export function formatDateToDMY(dateStr: string | null | undefined, fallback: string = "—") {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fallback;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function isWithinDateLimit(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  const limit = new Date(dateStr);
  if (Number.isNaN(limit.getTime())) return true;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    limit.setUTCDate(limit.getUTCDate() + 1);
  }

  return Date.now() < limit.getTime();
}

/** BCP-47 tag for each supported UI locale, for `Intl` / `toLocaleString`. */
export const INTL_LOCALES: Record<"pt" | "en", string> = { pt: "pt-PT", en: "en-GB" };

export function formatDateLong(
  dateStr: string | undefined | null,
  locale: "pt" | "en" = "pt"
) {
  // Accepts an absent date for the same reason `formatDateToTimeAgo` does: callers
  // pick a date out of a chain of optional fields, and an empty string is a better
  // answer than a type assertion at every call site.
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(INTL_LOCALES[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Locale-aware "month year" (e.g. "julho de 2024" / "July 2024"). */
export function formatMonthYear(
  dateStr: string | null | undefined,
  locale: "pt" | "en" = "pt",
  fallback = "—"
) {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(INTL_LOCALES[locale], { month: "long", year: "numeric" });
}
