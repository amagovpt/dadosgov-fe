interface FormatNumberOptions {
  /** Fixed number of fraction digits. When omitted, the value keeps its own decimals. */
  fractionDigits?: number;
  /** Thousands separator. Defaults to none. */
  thousandsSeparator?: string;
  /** Decimal separator. Defaults to a comma. */
  decimalSeparator?: string;
}

export function formatNumber(
  value: number,
  { fractionDigits, thousandsSeparator = "", decimalSeparator = "," }: FormatNumberOptions = {}
): string {
  if (!Number.isFinite(value)) return "";

  // "en-US" without grouping gives a plain "1234.56" string, avoiding exponent notation
  const plain = value.toLocaleString("en-US", {
    useGrouping: false,
    minimumFractionDigits: fractionDigits ?? 0,
    maximumFractionDigits: fractionDigits ?? 20,
  });

  const [integerPart, decimalPart] = plain.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  return decimalPart ? `${groupedInteger}${decimalSeparator}${decimalPart}` : groupedInteger;
}

export function formatMetricValue(
  value: number | undefined,
  fractionDigitsMillions: number = 1,
  fractionDigitsThousands: number = fractionDigitsMillions
): string {
  if (!value || value === 0) return "0";
  if (value >= 1_000_000) {
    return (
      (value / 1_000_000).toLocaleString("pt-PT", {
        maximumFractionDigits: fractionDigitsMillions,
      }) + " M"
    );
  }
  if (value >= 1_000) {
    return (
      (value / 1_000).toLocaleString("pt-PT", { maximumFractionDigits: fractionDigitsThousands }) +
      " mil"
    );
  }
  return value.toLocaleString("pt-PT");
}
