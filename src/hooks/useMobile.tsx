import { useSyncExternalStore } from "react";

const MOBILE_MAX_WIDTH = 1280; // 1280px
const MOBILE_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getServerSnapshot = () => false;

export default function useMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
