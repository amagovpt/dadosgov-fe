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
