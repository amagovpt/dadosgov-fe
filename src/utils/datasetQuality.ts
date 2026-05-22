import type { Dataset } from "@/types/api";

export const QUALITY_CRITERIA: [keyof NonNullable<Dataset["quality"]>, string][] = [
  ["dataset_description_quality", "Descrição"],
  ["has_resources", "Recursos"],
  ["license", "Licença"],
  ["has_open_format", "Formato aberto"],
  ["all_resources_available", "Recursos disponíveis"],
  ["resources_documentation", "Documentação"],
  ["spatial", "Cobertura espacial"],
  ["temporal_coverage", "Cobertura temporal"],
  ["update_frequency", "Frequência de atualização"],
];
