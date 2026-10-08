function formatCompactEUR(value: number, maximumFractionDigits: number = 1): string[] {
  const formatter = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
    notation: "compact",
    compactDisplay: "short",
  });

  const formatted = formatter.format(value);

  const formattedWithSuffix = formatted
    .replace(/\s*mM/i, " billion")
    .replace(/\s*Md/i, " billion")
    .replace(/\s*M\b/i, " million")
    .replace(/\s*K\b/i, " thousand");

  return formattedWithSuffix.split(/\s+/);
}

function formatCurrency(value: number, t: (suffix: string) => string): string {
  const [formatted, suffix] = formatCompactEUR(value);
  if (!suffix) return `${formatted} €`;
  // "1 milhão" vs "1,5 milhões": only an exact 1 takes the singular form
  const isOne = Number(formatted.replace(",", ".")) === 1;
  return `${formatted} ${t(isOne ? `${suffix}_one` : suffix)} €`;
}

const formatValueAsCurrency = (
  amount: number,
  locale = 'fr-FR',
  currency = 'EUR',
  minimumFractionDigits?: number,
  maximumFractionDigits?: number
) => {
  const value = amount;
  if (isNaN(value)) {
    return 'N/A';
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };
  if (minimumFractionDigits !== undefined) {
    options.minimumFractionDigits = minimumFractionDigits;
    options.maximumFractionDigits =
      maximumFractionDigits ?? minimumFractionDigits;
  }

  return new Intl.NumberFormat(locale, options).format(value);
};

export { formatCompactEUR, formatCurrency, formatValueAsCurrency };
