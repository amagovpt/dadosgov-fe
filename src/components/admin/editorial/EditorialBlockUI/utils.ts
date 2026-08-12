import { formatDistanceToNow } from "date-fns";
import { enUS, pt } from "date-fns/locale";

function resolveDateLocale(locale?: string) {
  return locale?.startsWith("en") ? enUS : pt;
}

export function getTimeAgoLabel(lastModified?: string | null, locale: string = "pt"): string {
  if (!lastModified) return locale.startsWith("en") ? "Unknown" : "Desconhecido";

  return formatDistanceToNow(new Date(lastModified), {
    locale: resolveDateLocale(locale),
    addSuffix: false,
  })
    .replace("less than ", "")
    .replace("about ", "")
    .replace("menos de ", "")
    .replace("cerca de ", "");
}

export function formatCompactMetric(value: number | undefined, locale: string = "pt"): string {
  if (!value || value === 0) return "0";

  return new Intl.NumberFormat(locale.startsWith("en") ? "en-US" : "pt-PT", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
