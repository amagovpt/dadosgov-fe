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
  if (!date) return locale === "pt" ? "Desconhecido" : "Unknown";
  const distance = formatDistanceToNow(new Date(date), { locale: DATE_FNS_LOCALES[locale] });
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

const INTL_LOCALES: Record<"pt" | "en", string> = { pt: "pt-PT", en: "en-GB" };

export function formatDateLong(dateStr: string, locale: "pt" | "en" = "pt") {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(INTL_LOCALES[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
