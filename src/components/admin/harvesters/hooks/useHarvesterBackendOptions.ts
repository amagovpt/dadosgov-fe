"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchHarvestBackends } from "@/service/api/harvesters";
import type { HarvestBackend } from "@/service/types/harvester";

/**
 * The harvester types the "Tipo" select may offer.
 *
 * The list has to come from `GET /api/1/harvest/backends/` and not from a
 * literal in the form: the API returns exactly the backends enabled by
 * `HARVESTER_BACKENDS` in the current environment, with the `display_name` each
 * one declares. A hardcoded list drifts from it in both directions — it hid
 * five backends from the creation wizard while the edit screen showed them, and
 * it could offer a type the environment has disabled, whose submission
 * `POST /harvest/sources/` then rejects (the `backend` field is an enum over
 * `get_enabled_backends()`).
 *
 * The edit screen already reads the same endpoint through
 * `useHarvesterDetailData`, so sourcing both from it is what keeps the two
 * screens in sync.
 */
export function useHarvesterBackendOptions() {
  const { t } = useTranslation("admin-harvesters");
  const [backends, setBackends] = useState<HarvestBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchHarvestBackends()
      .then((loaded) => {
        if (!cancelled) setBackends(loaded);
      })
      .catch(() => {
        // `fetchHarvestBackends` already swallows failures into an empty list;
        // this only covers an unexpected rejection so the select still settles.
        if (!cancelled) setBackends([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const noResultsText = useMemo(
    () => (isLoading ? t("form.typesLoading") : t("form.noResults")),
    [isLoading, t],
  );

  return {
    backends,
    isLoading,
    noResultsText,
    /** The endpoint answered, and there is nothing to pick from. */
    hasNoBackend: !isLoading && backends.length === 0,
  };
}
