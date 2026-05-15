import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export function formatDateToTimeAgo(
  date: string | undefined | null,
  unknown: string = "Desconhecido"
) {
  return date
    ? formatDistanceToNow(new Date(date), { locale: pt })
        .replace("aproximadamente ", "")
        .replace("quase ", "")
        .replace("menos de ", "")
        .replace("cerca de ", "")
    : unknown;
}

export function formatDateToDMY(dateStr: string) {
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
