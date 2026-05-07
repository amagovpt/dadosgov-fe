"use client";

export function formatCompactCount(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    return thousands % 1 === 0
      ? `${thousands} mil`
      : `${thousands.toFixed(1).replace(".", ",")} mil`;
  }
  return value.toLocaleString("pt-PT");
}

interface ReadQueryParamValuesOptions {
  splitComma?: boolean;
}

export function readQueryParamValues(
  params: URLSearchParams,
  paramName: string,
  options: ReadQueryParamValuesOptions = {}
): string[] {
  const values = params.getAll(paramName);
  if (!options.splitComma) return values;

  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function writeQueryParamValues(
  params: URLSearchParams,
  paramName: string,
  values: string[]
): void {
  params.delete(paramName);
  values.forEach((value) => params.append(paramName, value));
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function toggleSelection(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}
