import { useCallback, useEffect, useRef } from "react";

export function useDebouncedSearch(
  onDebouncedChange: (value: string) => void,
  delay = 400
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDebounced = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onDebouncedChange(value);
      }, delay);
    },
    [delay, onDebouncedChange]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return runDebounced;
}
