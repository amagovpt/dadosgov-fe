/**
 * PT-PT labels for reuse types and topics.
 *
 * The backend returns English labels from gettext when the request locale
 * isn't configured. Keep a frontend mapping so admin forms and public
 * pages display PT-PT consistently, regardless of backend locale.
 *
 * Keys mirror the constants in `backend/udata/core/reuse/constants.py`.
 */

import type { ReuseType, ReuseTopic } from "@/service/types/api";

export const REUSE_TYPE_LABELS_PT: Record<string, string> = {
  api: "API",
  application: "Aplicação",
  idea: "Ideia",
  news_article: "Artigo de imprensa",
  paper: "Artigo científico",
  post: "Publicação",
  visualization: "Visualização",
  hardware: "Dispositivo conectado",
};

export const REUSE_TOPIC_LABELS_PT: Record<string, string> = {
  health: "Saúde",
  transport_and_mobility: "Transportes e mobilidade",
  housing_and_development: "Habitação e desenvolvimento",
  food_and_agriculture: "Alimentação e agricultura",
  culture_and_recreation: "Cultura e lazer",
  economy_and_business: "Economia e negócios",
  environment_and_energy: "Ambiente e energia",
  work_and_training: "Trabalho e formação",
  politics_and_public_life: "Política e vida pública",
  safety_and_security: "Segurança",
  education_and_research: "Educação e investigação",
  society_and_demography: "Sociedade e demografia",
  law_and_justice: "Justiça",
  open_data_tools: "Ferramentas de dados abertos",
  others: "Outros",
};

export function localizeReuseType(
  item: ReuseType | { id: string; label: string },
): string {
  return REUSE_TYPE_LABELS_PT[item.id] ?? item.label;
}

export function localizeReuseTopic(
  item: ReuseTopic | { id: string; label: string },
): string {
  return REUSE_TOPIC_LABELS_PT[item.id] ?? item.label;
}

export function localizeReuseTypeId(id: string | null | undefined): string {
  if (!id) return "";
  return REUSE_TYPE_LABELS_PT[id] ?? id;
}

export function localizeReuseTopicId(id: string | null | undefined): string {
  if (!id) return "";
  return REUSE_TOPIC_LABELS_PT[id] ?? id;
}
