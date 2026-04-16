"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Preserve native hash-anchor navigation (e.g. /pages/support#ajuda).
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
