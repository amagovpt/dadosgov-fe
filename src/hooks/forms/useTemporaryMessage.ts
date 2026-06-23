"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTemporaryMessage<TValue>(
  clearedValue: TValue,
  defaultDurationMs = 10000,
) {
  const [message, setMessage] = useState<TValue>(clearedValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setTemporaryMessage = useCallback(
    (value: TValue, durationMs = defaultDurationMs) => {
      clearTimer();
      setMessage(value);
      timeoutRef.current = setTimeout(() => {
        setMessage(clearedValue);
        timeoutRef.current = null;
      }, durationMs);
    },
    [clearTimer, clearedValue, defaultDurationMs],
  );

  const clearTemporaryMessage = useCallback(() => {
    clearTimer();
    setMessage(clearedValue);
  }, [clearTimer, clearedValue]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    message,
    setMessage,
    setTemporaryMessage,
    clearTemporaryMessage,
  };
}
