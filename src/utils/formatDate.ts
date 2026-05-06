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
