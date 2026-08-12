/**
 * PT-PT fallback labels for update frequencies.
 *
 * The public dataset page resolves these through the `datasets` i18n namespace
 * (`frequency.<id>`) by passing `t`; this map stays as the fallback for the
 * call sites that have no translator yet (backoffice), where the backend label
 * would otherwise come back in English.
 */
export const frequencyLabelsMap: Record<string, string> = {
  // Sub-daily
  continuous: "Contínua",
  oneMinute: "A cada minuto",
  fiveMinutes: "A cada 5 minutos",
  tenMinutes: "A cada 10 minutos",
  fifteenMinutes: "A cada 15 minutos",
  thirtyMinutes: "A cada 30 minutos",
  hourly: "Horária",
  bihourly: "A cada 2 horas",
  trihourly: "A cada 3 horas",
  twelveHours: "A cada 12 horas",
  severalTimesADay: "Várias vezes ao dia",
  threeTimesADay: "3 vezes ao dia",
  semidaily: "Semidiária",
  daily: "Diária",
  // Weekly
  fiveTimesAWeek: "5 vezes por semana",
  threeTimesAWeek: "3 vezes por semana",
  semiweekly: "Bissemanal",
  weekly: "Semanal",
  biweekly: "Quinzenal",
  // Monthly
  threeTimesAMonth: "3 vezes por mês",
  semimonthly: "Bimensal",
  monthly: "Mensal",
  bimonthly: "Bimestral",
  // Yearly and above
  quarterly: "Trimestral",
  threeTimesAYear: "3 vezes por ano",
  semiannual: "Semestral",
  annual: "Anual",
  biennial: "Bienal",
  triennial: "Trienal",
  quadrennial: "Quadrienal",
  quinquennial: "Quinquenal",
  decennial: "Decenal",
  bidecennial: "Bidecenal",
  tridecennial: "Tridecenal",
  // Other
  punctual: "Pontual",
  irregular: "Irregular",
  never: "Nunca",
  notPlanned: "Não planeado",
  other: "Outro",
  unknown: "Desconhecida",
};

/**
 * Resolves a frequency label. Pass `t` (from the `datasets` namespace) to get
 * the label in the active locale; without it the PT map is used.
 */
export function getFrequencyLabel(
  id: string,
  fallbackLabel: string,
  t?: (key: string, options?: { defaultValue?: string }) => string
): string {
  const fallback = frequencyLabelsMap[id] || fallbackLabel;
  return t ? t(`frequency.${id}`, { defaultValue: fallback }) : fallback;
}
