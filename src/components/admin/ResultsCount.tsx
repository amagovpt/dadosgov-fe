import { twMerge } from "tailwind-merge";

export interface ResultsCountI {
  count: number;
  isLoading: boolean;
  className?: string;
}

export default function ResultsCount({ count, isLoading, className }: ResultsCountI) {
  return (
    <p className={twMerge("text-sm mb-16 text-neutral-700", className)}>
      {isLoading ? "A carregar..." : `${count} resultados`}
    </p>
  );
}
