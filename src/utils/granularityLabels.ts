export const granularityLabelsMap: Record<string, string> = {
  // Portugal-specific (IDs from pt: namespace)
  "pt:distrito": "Distrito",
  "pt:concelho": "Concelho",
  "pt:freguesia": "Freguesia",
  // Generic levels
  "country-group": "Grupo de países",
  country: "País",
  canton: "Cantão",
  town: "Cidade",
  commune: "Município",
  district: "Distrito",
  municipality: "Município",
  parish: "Freguesia",
  // French administrative levels
  epci: "EPCI",
  iris: "IRIS",
  "fr:commune": "Município",
  "fr:departement": "Departamento",
  "fr:region": "Região",
  "fr:arrondissement": "Distrito",
  // Other
  poi: "Ponto de interesse",
  other: "Outro",
};

export function getGranularityLabel(id: string, fallbackLabel: string): string {
  return granularityLabelsMap[id] || fallbackLabel;
}
