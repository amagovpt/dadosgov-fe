"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";
import {
  fetchLicenses,
  fetchFrequencies,
  fetchGranularities,
  fetchResourceTypes,
  fetchAllowedExtensions,
} from "@/service/api/datasets";
import { suggestSpatialZones, suggestTags } from "@/service/api/search";
import type {
  License,
  Frequency,
  Granularity,
  SpatialZone,
  TagSuggestion,
  ResourceType,
} from "@/service/types/catalog";
import type { Organization, UserRef } from "@/service/types/identity";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";
import { getZoneName } from "@/utils/spatialLabels";
import type { DatasetWizardForm } from "./useDatasetWizardForm";

interface UseDatasetWizardOptionsParams {
  form: DatasetWizardForm;
  user: UserRef | null;
  organizations: Organization[];
}

export function useDatasetWizardOptions({
  form,
  user,
  organizations,
}: UseDatasetWizardOptionsParams) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const {
    selectedProducer: producerDefaultValue,
    selectedLicenseValue,
    createdDataset,
    frequencyDefaultValue,
    selectedKeywords,
    spatialGranularityDefaultValue,
    selectedSpatialZonesValue,
    setSelectedSpatialZonesValue,
    spatialZones,
    setSpatialZones,
    spatialCoverageRef,
    selectedKeywordsValue,
    setSelectedKeywordsValue,
    selectedKeywordsRef,
  } = form;
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [allowedExtensions, setAllowedExtensions] = useState<string[] | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [granularities, setGranularities] = useState<Granularity[]>([]);
  const [spatialZoneSearch, setSpatialZoneSearch] = useState<SpatialZone[]>([]);
  const spatialZoneSearchRef = useRef<SpatialZone[]>([]);
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const licenseDefaultValue =
    selectedLicenseValue ?? createdDataset?.license ?? (licenses.length > 0 ? "notspecified" : "");
  const handleSpatialCoverageChange = useCallback(
    (value: string) => {
      const normalized = value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .join(",");
      setSelectedSpatialZonesValue(normalized);
      spatialCoverageRef.current = normalized;
      const ids = new Set(normalized.split(",").filter(Boolean));
      setSpatialZones((prev) => {
        // Pin newly selected zones; unpin deselected ones
        const seen = new Set(prev.map((z) => z.id));
        const additions = spatialZoneSearchRef.current.filter(
          (z) => ids.has(z.id) && !seen.has(z.id)
        );
        const kept = prev.filter((z) => ids.has(z.id));
        if (additions.length === 0 && kept.length === prev.length) return prev;
        return [...kept, ...additions];
      });
    },
    [setSelectedSpatialZonesValue, setSpatialZones, spatialCoverageRef]
  );

  const producerOptions = useMemo(() => {
    const options = [
      <DropdownOption key="user" value="user" selected={producerDefaultValue === "user"}>
        {user ? `${user.first_name} ${user.last_name}` : t("admin-datasets:form.producerSelf")}
      </DropdownOption>,
      ...organizations.map((org) => (
        <DropdownOption key={org.id} value={org.id} selected={producerDefaultValue === org.id}>
          {org.name}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="identity">{options}</DropdownSection>;
  }, [user, organizations, producerDefaultValue, t]);

  const licenseOptions = useMemo(() => {
    const options = licenses.map((license) => (
      <DropdownOption
        key={license.id}
        value={license.id}
        selected={licenseDefaultValue === license.id}
      >
        {license.title}
      </DropdownOption>
    ));
    return <DropdownSection name="licenses">{options}</DropdownSection>;
  }, [licenses, licenseDefaultValue]);

  const frequencyOptions = useMemo(() => {
    const options = frequencies.map((freq) => (
      <DropdownOption key={freq.id} value={freq.id} selected={frequencyDefaultValue === freq.id}>
        {getFrequencyLabel(freq.id, freq.label, (key, options) => t(`datasets:${key}`, options))}
      </DropdownOption>
    ));
    return <DropdownSection name="frequencies">{options}</DropdownSection>;
  }, [frequencies, frequencyDefaultValue, t]);

  const tagOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedKeywords.map((k) => k.toLowerCase()));
    const seen = new Set<string>();
    const uniqueTags = [...tags, ...tagSearch].filter((tag) => {
      const key = tag.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = selectedKeywords.filter(
      (keyword) => !seen.has(keyword.toLowerCase())
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tags, ...tagSearch].some((tag) => tag.text.toLowerCase() === trimmedLower) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption key={`__create__${trimmedLower}`} value={trimmed} selected={false}>
              {t("admin-datasets:form.keywordsCreate", { value: trimmed })}
            </DropdownOption>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <DropdownOption key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </DropdownOption>
      )),
      ...uniqueTags.map((tag) => (
        <DropdownOption
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tags, tagSearch, selectedKeywords, keywordSearch, t]);

  const allSpatialZones = useMemo(() => {
    const seen = new Set<string>();
    const merged: SpatialZone[] = [];
    for (const zone of [...spatialZones, ...spatialZoneSearch]) {
      if (!seen.has(zone.id)) {
        seen.add(zone.id);
        merged.push(zone);
      }
    }
    return merged.sort((a, b) => getZoneName(a).localeCompare(getZoneName(b), "pt"));
  }, [spatialZones, spatialZoneSearch]);

  const spatialCoverageOptions = useMemo(() => {
    const selectedIds = new Set(
      (selectedSpatialZonesValue ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    );
    const options = allSpatialZones.map((zone) => (
      <DropdownOption key={zone.id} value={zone.id} selected={selectedIds.has(zone.id)}>
        {zone.code ? `${getZoneName(zone)} (${zone.code})` : getZoneName(zone)}
      </DropdownOption>
    ));
    if (options.length === 0) {
      options.push(
        <DropdownOption key="empty" value="">
          —
        </DropdownOption>
      );
    }
    return <DropdownSection name="spatial-coverage">{options}</DropdownSection>;
  }, [allSpatialZones, selectedSpatialZonesValue]);

  const selectedZoneObjects = useMemo<SpatialZone[]>(() => {
    const ids = (selectedSpatialZonesValue ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return [];
    const zoneMap = new Map(allSpatialZones.map((zone) => [zone.id, zone]));
    return ids.map((id) => zoneMap.get(id)).filter((zone): zone is SpatialZone => Boolean(zone));
  }, [selectedSpatialZonesValue, allSpatialZones]);

  const granularityOptions = useMemo(() => {
    const options = granularities.map((granularity) => (
      <DropdownOption
        key={granularity.id}
        value={granularity.id}
        selected={spatialGranularityDefaultValue === granularity.id}
      >
        {getGranularityLabel(granularity.id, granularity.name, (key, options) =>
          t(`datasets:${key}`, options)
        )}
      </DropdownOption>
    ));
    return <DropdownSection name="spatial-granularity">{options}</DropdownSection>;
  }, [granularities, spatialGranularityDefaultValue, t]);

  useEffect(() => {
    if (selectedKeywordsValue !== null) return;
    const restored = selectedKeywordsRef.current || (createdDataset?.tags?.join(",") ?? "");
    if (!restored) return;
    setSelectedKeywordsValue(restored);
    selectedKeywordsRef.current = restored;
  }, [createdDataset, selectedKeywordsValue, selectedKeywordsRef, setSelectedKeywordsValue]);

  useEffect(() => {
    async function loadDropdownData() {
      try {
        const [
          licensesData,
          frequenciesData,
          granularitiesData,
          tagsData,
          zonesData,
          resTypes,
          extData,
        ] = await Promise.all([
          fetchLicenses(),
          fetchFrequencies(),
          fetchGranularities(),
          suggestTags("", 50),
          suggestSpatialZones("", 20),
          fetchResourceTypes(),
          fetchAllowedExtensions(),
        ]);
        setLicenses(licensesData);
        setFrequencies(frequenciesData);
        setGranularities(granularitiesData);
        setTags(tagsData ?? []);
        spatialZoneSearchRef.current = zonesData ?? [];
        setSpatialZoneSearch(zonesData ?? []);
        setResourceTypes(resTypes);
        setAllowedExtensions(extData);
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      }
    }
    loadDropdownData();
  }, []);

  useEffect(() => {
    const q = keywordSearch.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = (await suggestTags(q, 20)) ?? [];
        setTagSearch(res);
      } catch {
        setTagSearch([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordSearch]);

  const handleSpatialZonesSearchQuery = useCallback((q: string) => {
    if (!q) return;
    suggestSpatialZones(q, 20)
      .then((results) => {
        spatialZoneSearchRef.current = results ?? [];
        setSpatialZoneSearch(results ?? []);
      })
      .catch(() => {
        spatialZoneSearchRef.current = [];
        setSpatialZoneSearch([]);
      });
  }, []);

  const handleRemoveSpatialZoneTag = useCallback(
    (zoneId: string) => {
      const savedScroll = window.scrollY;
      setSelectedSpatialZonesValue((prev) => {
        const ids = (prev ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        const nextIds = ids.filter((id) => id !== zoneId);
        const next = nextIds.join(",");
        spatialCoverageRef.current = next;
        return next || null;
      });
      setSpatialZones((prev) => prev.filter((zone) => zone.id !== zoneId));
      setTimeout(() => {
        document
          .getElementById("agora-input-select-dataset-spatial-coverage-control")
          ?.focus({ preventScroll: true });
        window.scrollTo({ top: savedScroll, behavior: "instant" });
      }, 50);
    },
    [setSelectedSpatialZonesValue, setSpatialZones, spatialCoverageRef]
  );

  const handleKeywordsSearchInput = useCallback((q: string) => {
    setKeywordSearch(q);
    if (q.trim().length < 2) {
      setTagSearch([]);
    }
  }, []);

  const handleKeywordsSelectValueChange = useCallback(
    (value: string) => {
      setSelectedKeywordsValue(value);
      const selected = value.split(",").filter(Boolean);
      let addedNew = false;
      selected.forEach((v) => {
        const lower = v.toLowerCase();
        const existsInTags = tags.some((tag) => tag.text.toLowerCase() === lower);
        const existsInSearch = tagSearch.some((tag) => tag.text.toLowerCase() === lower);
        if (!existsInTags && !existsInSearch) {
          addedNew = true;
          setTags((prev) => {
            if (prev.some((tag) => tag.text.toLowerCase() === lower)) {
              return prev;
            }
            return [...prev, { text: v }];
          });
        }
      });
      if (addedNew) {
        setKeywordSearch("");
      }
    },
    [tags, tagSearch, setSelectedKeywordsValue]
  );

  const handleKeywordTagRemove = useCallback(
    (keyword: string) => {
      const next = selectedKeywords
        .filter((v) => v.toLowerCase() !== keyword.toLowerCase())
        .join(",");
      setSelectedKeywordsValue(next);
      selectedKeywordsRef.current = next;
    },
    [selectedKeywords, selectedKeywordsRef, setSelectedKeywordsValue]
  );

  return {
    licenseDefaultValue,
    producerOptions,
    licenseOptions,
    frequencyOptions,
    tagOptions,
    spatialCoverageOptions,
    selectedZoneObjects,
    granularityOptions,
    resourceTypes,
    allowedExtensions,
    handleSpatialCoverageChange,
    handleSpatialZonesSearchQuery,
    handleRemoveSpatialZoneTag,
    handleKeywordsSearchInput,
    handleKeywordsSelectValueChange,
    handleKeywordTagRemove,
  };
}
