export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://dados.gov.pt/api/1";

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  main: "Ficheiros principais",
  file: "Ficheiros principais",
  documentation: "Documentação",
};

export const EXTRAS_KEY_LABELS: Record<string, string> = {
  "check:id": "verificação:id",
  "check:available": "verificar: disponível",
  "check:status": "verificar:status",
  "check:timeout": "verificação:tempo limite",
  "check:date": "verificar:data",
  "check:headers:content-type": "verificar:cabeçalhos:tipo de conteúdo",
  "check:headers:content-length": "verificar:cabeçalhos:comprimento do conteúdo",
  "analysis:check_id": "análise:verificar_id",
  "analysis:content-length": "análise:comprimento do conteúdo",
  "analysis:checksum": "análise: checksum",
  "analysis:mime-type": "análise:tipo MIME",
  "analysis:last-modified-at": "análise:última-modificação-em",
  "analysis:last-modified-detection": "análise:detecção de última modificação",
  "analysis:parsing:started_at": "análise:análise:iniciada_em",
  "analysis:parsing:finished_at": "análise:análise:concluída_em",
  "analysis:parsing:error": "análise:análise:erro",
  "analysis:parsing:parsing_table": "análise:análise sintática:tabela_de_análise",
};

export const TABULAR_FORMATS = ["csv", "tsv", "xls", "xlsx", "ods"];
export const SPREADSHEET_FORMATS = ["xls", "xlsx", "ods"];
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SAMPLE_ROWS = 100;
