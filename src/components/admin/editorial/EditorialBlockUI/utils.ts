import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export function getTimeAgoLabel(lastModified?: string | null): string {
  if (!lastModified) return "Desconhecido";
  return formatDistanceToNow(new Date(lastModified), { locale: pt, addSuffix: false })
    .replace("menos de ", "")
    .replace("cerca de ", "");
}
