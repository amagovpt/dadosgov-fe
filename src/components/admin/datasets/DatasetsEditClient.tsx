"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Button,
  Icon,
  StatusCard,
  Pill,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { Dropdown } from "@/components/Primitives/Dropdown";

import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  fetchDataset,
  updateDataset,
  deleteDataset,
  uploadResource,
  createResource,
  fetchLicenses,
  fetchFrequencies,
  fetchResourceTypes,
  fetchGranularities,
  fetchSpatialZonesByIds,
} from "@/api/datasets";
import { fetchActivity } from "@/api/activity";
import { requestTransfer } from "@/api/transfers";
import { fetchDiscussions } from "@/api/discussions-topics";
import { suggestSpatialZones, suggestTags } from "@/api/search";
import type { RecipientSelection } from "@/components/admin/RecipientSelect";
import {
  Dataset,
  License,
  Frequency,
  Granularity,
  SpatialZone,
  TagSuggestion,
  Activity,
  Resource,
  ResourceType,
  Discussion,
} from "@/types/api";
import DeleteResourcePopup from "@/components/admin/datasets/DeleteResourcePopup";
import DatasetsEditDeletePopup from "@/components/admin/datasets/DatasetsEditDeletePopup";
import DatasetsEditResourceDetailPopup from "@/components/admin/datasets/DatasetsEditResourceDetailPopup";
import DatasetsEditResourceEditPopup from "@/components/admin/datasets/DatasetsEditResourceEditPopup";
import DatasetsEditMetadataTab from "@/components/admin/datasets/DatasetsEditMetadataTab";
import DatasetsEditResourcesTab from "@/components/admin/datasets/DatasetsEditResourcesTab";
import DatasetsEditDiscussionsTab from "@/components/admin/datasets/DatasetsEditDiscussionsTab";
import DatasetsEditActivitiesTab from "@/components/admin/datasets/DatasetsEditActivitiesTab";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";
import {
  POISONED_FILE_WARNING,
  translateUploadError,
} from "@/lib/security/translateUploadError";

const activityLabels: Record<string, string> = {
  "created a dataset": "criou um conjunto de dados",
  "updated a dataset": "atualizou um conjunto de dados",
  "deleted a dataset": "eliminou um conjunto de dados",
  "added a resource to a dataset": "adicionou um recurso a um conjunto de dados",
  "updated a resource": "atualizou um recurso",
  "removed a resource from a dataset": "removeu um recurso de um conjunto de dados",
  "created a dataservice": "criou um serviço de dados",
  "updated a dataservice": "atualizou um serviço de dados",
  "deleted a dataservice": "eliminou um serviço de dados",
  "created a topic": "criou um tema",
  "updated a topic": "atualizou um tema",
  "added an element to a topic": "adicionou um elemento a um tema",
  "updated an element in a topic": "atualizou um elemento num tema",
  "removed an element from a topic": "removeu um elemento de um tema",
  "created an organization": "criou uma organização",
  "updated an organization": "atualizou uma organização",
  "followed a user": "seguiu um utilizador",
  "discussed a dataservice": "comentou um serviço de dados",
  "discussed a dataset": "comentou um conjunto de dados",
  "discussed a reuse": "comentou uma reutilização",
  "followed a dataservice": "seguiu um serviço de dados",
  "followed a dataset": "seguiu um conjunto de dados",
  "followed a reuse": "seguiu uma reutilização",
  "followed an organization": "seguiu uma organização",
  "created a reuse": "criou uma reutilização",
  "updated a reuse": "atualizou uma reutilização",
  "deleted a reuse": "eliminou uma reutilização",
};

function translateActivityLabel(label: string): string {
  return activityLabels[label] || label;
}

export default function DatasetsEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const datasetId = (params?.datasetId as string) || searchParams.get("id") || "";
  const slug = searchParams.get("slug") || datasetId;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const selectedLicenseRef = useRef("");
  const selectedFrequencyRef = useRef("");
  const [temporalStart, setTemporalStart] = useState("");
  const [temporalEnd, setTemporalEnd] = useState("");
  const [featured, setFeatured] = useState(false);

  // Refs for IsolatedSelect (avoid setState during render cycle)
  const keywordsRef = useRef("");
  const spatialCoverageRef = useRef("");
  const spatialGranularityRef = useRef("");

  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploadingRef = useRef(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Dropdown data
  const [licenses, setLicenses] = useState<License[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [granularities, setGranularities] = useState<Granularity[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [spatialZones, setSpatialZones] = useState<SpatialZone[]>([]);
  const [spatialZoneSearch, setSpatialZoneSearch] = useState<SpatialZone[]>([]);
  const spatialZoneSearchRef = useRef<SpatialZone[]>([]);
  const [selectedSpatialZonesValue, setSelectedSpatialZonesValue] = useState("");

  // Loaded default values for IsolatedSelect (needed because data arrives async after mount)
  const [loadedTitle, setLoadedTitle] = useState("");
  const [loadedAcronym, setLoadedAcronym] = useState("");
  const [loadedLicense, setLoadedLicense] = useState("");
  const [loadedFrequency, setLoadedFrequency] = useState("");
  const [loadedKeywords, setLoadedKeywords] = useState("");
  const [loadedSpatialGranularity, setLoadedSpatialGranularity] = useState("");
  const [loadedSpatialZones, setLoadedSpatialZones] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);

  // Activity data
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false);
  const [discussionsTotal, setDiscussionsTotal] = useState<number | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [latestActivity, setLatestActivity] = useState<Activity | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [ds, licensesData, frequenciesData, granularitiesData, resTypes] = await Promise.all([
          fetchDataset(slug),
          fetchLicenses(),
          fetchFrequencies(),
          fetchGranularities(),
          fetchResourceTypes(),
        ]);
        setDataset(ds);
        setTitle(ds.title);
        setAcronym(ds.acronym || "");
        setLoadedTitle(ds.title);
        setLoadedAcronym(ds.acronym || "");
        setDescription(ds.description);
        setShortDescription(ds.description_short || "");
        setFeatured(ds.featured || false);

        const license = ds.license || "";
        const frequency = ds.frequency || "";
        const keywords = (ds.tags || []).join(",");
        const spatialGranularity = ds.spatial?.granularity || "";

        selectedLicenseRef.current = license;
        selectedFrequencyRef.current = frequency;
        keywordsRef.current = keywords;
        spatialGranularityRef.current = spatialGranularity;

        setLoadedLicense(license);
        setLoadedFrequency(frequency);
        setLoadedKeywords(keywords);
        setLoadedSpatialGranularity(spatialGranularity);

        if (ds.temporal_coverage) {
          const toDateOnly = (iso: string) => {
            if (!iso) return "";
            // Keep PT-formatted values as-is (avoid JS mm/dd parsing ambiguity).
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
          };
          setTemporalStart(toDateOnly(ds.temporal_coverage.start || ""));
          setTemporalEnd(toDateOnly(ds.temporal_coverage.end || ""));
        }
        setLicenses(licensesData);
        setFrequencies(frequenciesData);
        setGranularities(granularitiesData);
        setResourceTypes(resTypes);

        suggestTags("", 50).then(setTagSuggestions);
        suggestSpatialZones("", 20).then((results) => {
          spatialZoneSearchRef.current = results;
          setSpatialZoneSearch(results);
        });

        if (ds.spatial?.zones?.length) {
          fetchSpatialZonesByIds(ds.spatial.zones).then((currentZones) => {
            const currentIds = currentZones.map((z) => z.id);
            setSpatialZones(currentZones);
            setLoadedSpatialZones(currentIds);
            setSelectedSpatialZonesValue(currentIds.join(","));
            spatialCoverageRef.current = currentIds.join(",");
          });
        }

        fetchActivity(ds.id, 1, 1)
          .then((res) => {
            if (res.data.length > 0) setLatestActivity(res.data[0]);
          })
          .catch((err) => console.error("Error loading latest activity:", err));

        fetchDiscussions(ds.id, 1, 1)
          .then((res) => setDiscussionsTotal(res.total))
          .catch(() => {});
      } catch (error) {
        console.error("Error loading dataset:", error);
        setApiError("Erro ao carregar o conjunto de dados.");
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) loadData();
  }, [slug]);

  const loadDiscussions = () => {
    if (discussionsLoaded || !dataset) return;
    setDiscussionsLoading(true);
    fetchDiscussions(dataset.id)
      .then((res) => {
        setDiscussions(res.data);
        setDiscussionsTotal(res.total);
        setDiscussionsLoaded(true);
      })
      .catch((err) => console.error("Error loading discussions:", err))
      .finally(() => setDiscussionsLoading(false));
  };

  const loadActivities = () => {
    if (activitiesLoaded || !dataset) return;
    setActivitiesLoading(true);
    fetchActivity(dataset.id)
      .then((res) => {
        setActivities(res.data);
        setActivitiesLoaded(true);
      })
      .catch((err) => console.error("Error loading activities:", err))
      .finally(() => setActivitiesLoading(false));
  };

  // Memoized children for IsolatedSelect to prevent re-render cascades
  const licenseOptions = useMemo(() => {
    const options = licenses.map((license) => (
      <Dropdown.Option key={license.id} value={license.id} selected={license.id === loadedLicense}>
        {license.title}
      </Dropdown.Option>
    ));
    return <Dropdown.Section name="licenses">{options}</Dropdown.Section>;
  }, [licenses, loadedLicense]);

  const frequencyDefaultValue = loadedFrequency;

  const frequencyOptions = useMemo(() => {
    const options = frequencies.map((freq) => (
      <Dropdown.Option key={freq.id} value={freq.id} selected={freq.id === frequencyDefaultValue}>
        {getFrequencyLabel(freq.id, freq.label)}
      </Dropdown.Option>
    ));
    return <Dropdown.Section name="frequencies">{options}</Dropdown.Section>;
  }, [frequencies, frequencyDefaultValue]);

  const selectedKeywords = useMemo(
    () => (loadedKeywords ? loadedKeywords.split(",").filter(Boolean) : []),
    [loadedKeywords]
  );

  const keywordOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedKeywords.map((k) => k.toLowerCase()));
    const seen = new Set<string>();
    const uniqueTags = [...tagSuggestions, ...tagSearch].filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = selectedKeywords.filter(
      (keyword) => !seen.has(keyword.toLowerCase()),
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tagSuggestions, ...tagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <Dropdown.Option
              key={`__create__${trimmedLower}`}
              value={trimmed}
              selected={false}
            >
              Criar &quot;{trimmed}&quot;
            </Dropdown.Option>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <Dropdown.Option key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </Dropdown.Option>
      )),
      ...uniqueTags.map((tag) => (
        <Dropdown.Option
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </Dropdown.Option>
      )),
    ];
    return <Dropdown.Section name="keywords">{options}</Dropdown.Section>;
  }, [tagSuggestions, tagSearch, selectedKeywords, keywordSearch]);

  const allSpatialZones = useMemo(() => {
    const seen = new Set<string>();
    const merged: SpatialZone[] = [];
    for (const z of [...spatialZones, ...spatialZoneSearch]) {
      if (!seen.has(z.id)) {
        seen.add(z.id);
        merged.push(z);
      }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [spatialZones, spatialZoneSearch]);

  const effectiveSpatialIds = (selectedSpatialZonesValue || loadedSpatialZones.join(","))
    .split(",")
    .filter(Boolean);
  const handleSpatialCoverageChange = useCallback((value: string) => {
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
        (z) => ids.has(z.id) && !seen.has(z.id),
      );
      const kept = prev.filter((z) => ids.has(z.id));
      if (additions.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...additions];
    });
  }, []);
  const selectedZoneObjects = useMemo<SpatialZone[]>(() => {
    const effective = selectedSpatialZonesValue || loadedSpatialZones.join(",");
    const ids = effective.split(",").filter(Boolean);
    if (ids.length === 0) return [];

    const zoneMap = new Map(allSpatialZones.map((z) => [z.id, z]));
    return ids.map((id) => zoneMap.get(id)).filter((z): z is SpatialZone => Boolean(z));
  }, [selectedSpatialZonesValue, loadedSpatialZones, allSpatialZones]);

  const spatialCoverageOptions = useMemo(() => {
    const effective = selectedSpatialZonesValue || loadedSpatialZones.join(",");
    const selectedIds = new Set(effective.split(",").filter(Boolean));
    const options = allSpatialZones.map((z) => (
      <Dropdown.Option key={z.id} value={z.id} selected={selectedIds.has(z.id)}>
        {z.code ? `${z.name} (${z.code})` : z.name}
      </Dropdown.Option>
    ));
    if (options.length === 0) {
      options.push(
        <Dropdown.Option key="empty" value="">
          —
        </Dropdown.Option>
      );
    }
    return <Dropdown.Section name="spatial-coverage">{options}</Dropdown.Section>;
  }, [allSpatialZones, selectedSpatialZonesValue, loadedSpatialZones]);

  const spatialGranularityOptions = useMemo(() => {
    const options = [
      <Dropdown.Option key="empty" value="">
        —
      </Dropdown.Option>,
      ...granularities.map((g) => (
        <Dropdown.Option
          key={g.id}
          value={g.id}
          selected={g.id === loadedSpatialGranularity}
        >
          {getGranularityLabel(g.id, g.name)}
        </Dropdown.Option>
      )),
    ];
    return <Dropdown.Section name="spatial-granularity">{options}</Dropdown.Section>;
  }, [granularities, loadedSpatialGranularity]);

  const clearError = useCallback((field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (value.trim()) clearError("title");
    },
    [clearError]
  );

  const handleSaveMetadata = async () => {
    if (!dataset) return;
    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!description.trim()) errors.description = true;
    if (temporalStart && temporalEnd) {
      const [startDd, startMm, startYyyy] = temporalStart.split("/");
      const [endDd, endMm, endYyyy] = temporalEnd.split("/");
      const startDate = new Date(`${startYyyy}-${startMm}-${startDd}`);
      const endDate = new Date(`${endYyyy}-${endMm}-${endDd}`);
      if (endDate <= startDate) errors.temporalEnd = true;
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      requestAnimationFrame(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setFormErrors({});
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);

    try {
      const tagsValue = keywordsRef.current;
      const tags = tagsValue ? tagsValue.split(",").filter(Boolean) : [];
      const granularity = spatialGranularityRef.current || undefined;
      const zonesValue = spatialCoverageRef.current;
      const zones = zonesValue
        ? zonesValue
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined;
      let validZones = zones;
      let zoneDetails: SpatialZone[] = [];
      if (zones && zones.length > 0) {
        zoneDetails = await fetchSpatialZonesByIds(zones);
        const validZoneIds = new Set(zoneDetails.map((z) => z.id));
        validZones = zones.filter((id) => validZoneIds.has(id));
        if (validZones.length !== zones.length) {
          const normalized = validZones.join(",");
          spatialCoverageRef.current = normalized;
          setSelectedSpatialZonesValue(normalized);
        }
      }
      let resolvedGranularity = granularity;
      if (validZones && validZones.length > 0) {
        const selectedZoneSet = new Set(validZones);
        const levels = Array.from(
          new Set(
            zoneDetails
              .filter((z) => selectedZoneSet.has(z.id))
              .map((z) => (typeof z.level === "string" ? z.level.trim() : ""))
              .filter(Boolean)
          )
        );
        if (levels.length === 1) {
          resolvedGranularity = levels[0];
        } else if (levels.length > 1 && resolvedGranularity && !levels.includes(resolvedGranularity)) {
          resolvedGranularity = levels[0];
        }
        spatialGranularityRef.current = resolvedGranularity || "";
      }

      const updated = await updateDataset(dataset.id, {
        title: title.trim(),
        description: description.trim(),
        description_short: shortDescription.trim() || undefined,
        acronym: acronym.trim() || undefined,
        featured,
        tags,
        license: selectedLicenseRef.current || undefined,
        frequency: selectedFrequencyRef.current || undefined,
        temporal_coverage: temporalStart
          ? {
              start: (() => {
                const [dd, mm, yyyy] = temporalStart.split("/");
                return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
              })(),
              ...(temporalEnd
                ? {
                    end: (() => {
                      const [dd, mm, yyyy] = temporalEnd.split("/");
                      return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
                    })(),
                  }
                : {}),
            }
          : undefined,
        ...(resolvedGranularity || validZones
          ? {
              spatial: {
                geom: dataset.spatial?.geom ?? null,
                zones: validZones ?? dataset.spatial?.zones ?? [],
                granularity: resolvedGranularity ?? null,
              },
            }
          : {}),
      });
      setDataset(updated);
      setApiSuccess("Conjunto de dados atualizado com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
      requestAnimationFrame(() => {
        // Keep feedback visible after save.
        window.scrollTo({ top: 0, behavior: "smooth" });
        tabsRef.current?.focus({ preventScroll: true });
      });
    } catch (error: unknown) {
      const err = error as { status?: number; data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const flattenValue = (val: unknown): string => {
          if (Array.isArray(val)) return val.map(flattenValue).join("; ");
          if (val && typeof val === "object")
            return Object.values(val as Record<string, unknown>)
              .map(flattenValue)
              .join("; ");
          return String(val);
        };
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${flattenValue(val)}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao atualizar o conjunto de dados.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveDataset = async () => {
    if (!dataset) return;
    setIsSubmitting(true);
    try {
      await updateDataset(dataset.id, { archived: new Date().toISOString() });
      router.push("/pages/admin/me/datasets?status=archived");
    } catch (error) {
      console.error("Error archiving dataset:", error);
      setApiError("Erro ao arquivar o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferDataset = async (
    recipient: RecipientSelection,
    comment: string,
  ) => {
    if (!dataset) throw new Error("Conjunto de dados não carregado.");
    setApiError(null);
    setApiSuccess(null);
    await requestTransfer({
      subject: { class: "Dataset", id: dataset.id },
      recipient: { class: recipient.class, id: recipient.id },
      comment: comment || undefined,
    });
    hide();
    setApiSuccess(
      `Pedido de transferência enviado para ${recipient.label}. O destinatário tem de aceitar o pedido para a transferência ficar concluída.`,
    );
    setTimeout(() => setApiSuccess(null), 15000);
  };

  const handleUnarchiveDataset = async () => {
    if (!dataset) return;
    setIsSubmitting(true);
    try {
      const updated = await updateDataset(dataset.id, { archived: null });
      setDataset(updated);
    } catch (error) {
      console.error("Error unarchiving dataset:", error);
      setApiError("Erro ao desarquivar o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!dataset) return;
    setIsSubmitting(true);
    try {
      await deleteDataset(dataset.id);
      hide();
      router.push("/pages/admin/me/datasets");
    } catch (error) {
      console.error("Error deleting dataset:", error);
      setApiError("Erro ao eliminar o conjunto de dados.");
      hide();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0 || !dataset) return;
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;
    setIsSubmitting(true);
    setApiError(null);
    setFileUploadError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadResource(dataset.id, file);
      }
      const updated = await fetchDataset(slug);
      setDataset(updated);
      setUploaderKey((k) => k + 1);
      setApiSuccess("Ficheiro(s) carregado(s) com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error) {
      const err = error as { status?: number; data?: Record<string, unknown>; message?: string };
      console.error("Error uploading resource:", err.status, err.data ?? err.message ?? error);
      if (err.data && typeof err.data === "object" && Object.keys(err.data).length > 0) {
        const flattenValue = (val: unknown): string => {
          if (Array.isArray(val)) return val.map(flattenValue).join("; ");
          if (val && typeof val === "object")
            return Object.values(val as Record<string, unknown>)
              .map(flattenValue)
              .join("; ");
          return String(val);
        };
        const msg =
          (err.data.message as string) ||
          Object.entries(err.data)
            .map(([k, v]) => `${k}: ${flattenValue(v)}`)
            .join(", ");
        setFileUploadError(`Erro ao carregar ficheiro(s): ${translateUploadError(msg)}`);
      } else if (err.message) {
        setFileUploadError(`Erro ao carregar ficheiro(s): ${translateUploadError(err.message)}`);
      } else {
        const statusHint = err.status ? ` (HTTP ${err.status})` : "";
        setFileUploadError(`Erro ao carregar ficheiro(s)${statusHint}. Tente novamente.`);
      }
    } finally {
      isUploadingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = (resource: Resource) => {
    if (!dataset) return;
    show(
      <DeleteResourcePopup
        datasetId={dataset.id}
        resource={resource}
        onDeleted={() => {
          setDataset((prev) =>
            prev ? { ...prev, resources: prev.resources.filter((r) => r.id !== resource.id) } : prev
          );
          setApiSuccess("Ficheiro eliminado com sucesso.");
          setTimeout(() => setApiSuccess(null), 10000);
        }}
      />,
      {
        title: "Eliminar ficheiro",
        closeAriaLabel: "Fechar",
        dimensions: "m",
      }
    );
  };

  const refreshDataset = async () => {
    const updated = await fetchDataset(slug);
    setDataset(updated);
  };

  const handleResourceEdit = (resource: Resource) => {
    if (!dataset) return;
    show(
      <DatasetsEditResourceEditPopup
        resource={resource}
        datasetId={dataset.id}
        resourceTypes={resourceTypes}
        onSaved={async () => {
          hide();
          await refreshDataset();
          setApiSuccess("Recurso atualizado com sucesso.");
          setTimeout(() => setApiSuccess(null), 10000);
        }}
        onCancel={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: "Fechar",
        dimensions: "l",
      }
    );
  };

  const handleResourceClick = (resource: Resource) => {
    if (!dataset) return;
    const openEdit = () => {
      hide();
      setTimeout(() => {
        show(
          <DatasetsEditResourceEditPopup
            resource={resource}
            datasetId={dataset.id}
            resourceTypes={resourceTypes}
            onSaved={async () => {
              hide();
              await refreshDataset();
              setApiSuccess("Recurso atualizado com sucesso.");
              setTimeout(() => setApiSuccess(null), 10000);
            }}
            onCancel={hide}
          />,
          {
            title: resource.title,
            closeAriaLabel: "Fechar",
            dimensions: "l",
          }
        );
      }, 100);
    };

    const openDelete = () => {
      hide();
      setTimeout(() => {
        handleDeleteResource(resource);
      }, 100);
    };

    show(
      <DatasetsEditResourceDetailPopup
        resource={resource}
        onEdit={openEdit}
        onDelete={openDelete}
        onClose={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: "Fechar",
        dimensions: "l",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-600">A carregar...</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="admin-page">
        <StatusCard variant="danger" showIcon description="Conjunto de dados não encontrado." />
        <Button variant="primary" onClick={() => router.push("/pages/admin/me/datasets")}>
          Voltar
        </Button>
      </div>
    );
  }

  const qualityCriteria: (keyof NonNullable<Dataset["quality"]>)[] = [
    "dataset_description_quality",
    "has_resources",
    "license",
    "has_open_format",
    "all_resources_available",
    "resources_documentation",
    "spatial",
    "temporal_coverage",
    "update_frequency",
  ];

  const qualityScore = (() => {
    const q = dataset.quality;
    if (!q) return 0;
    if (q.score > 0) return Math.round(q.score * 100);
    const met = qualityCriteria.filter((key) => q[key] === true).length;
    return Math.round((met / qualityCriteria.length) * 100);
  })();

  const metadataCount = (() => {
    const q = dataset.quality;
    if (!q) return 0;
    return qualityCriteria.filter((key) => q[key] === true).length;
  })();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Conjuntos de dados", url: "/pages/admin/me/datasets" },
            { label: dataset.title, url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">{dataset.title}</h1>
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => window.open(`/pages/datasets/${dataset.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="w-16 h-16" />
            Ver página pública
          </span>
        </Button>
      </div>

      {apiError && (
        <div className="my-24">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}
      {apiSuccess && (
        <div className="my-24">
          <StatusCard variant="success" showIcon description={apiSuccess} />
        </div>
      )}

      <div className="admin-edit-info">
        <div className="admin-edit-info__badges">
          <Pill variant={dataset.private ? "warning" : "success"}>
            {dataset.private ? "RASCUNHO" : "PÚBLICO"}
          </Pill>
          {dataset.featured && <Pill variant="informative">DESTAQUE</Pill>}
          <span className="admin-edit-info__stat">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="admin-edit-info__stat-icon"
            >
              <path
                d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z"
                fill="#64718B"
              />
            </svg>
            {`${(dataset.metrics?.views ?? 0) + (dataset.metrics?.resources_downloads ?? 0) + (dataset.metrics?.reuses ?? 0) + (dataset.metrics?.followers ?? 0)} estatísticas`}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-document" className="admin-edit-info__stat-icon" />
            {`${metadataCount} metadados`}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
            {qualityScore > 0 ? (qualityScore / 10).toFixed(1).replace(".", ",") : "0"}
          </span>
        </div>

        <p className="admin-edit-info__activity">
          <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
          {latestActivity ? (
            <>
              {" Atividade mais recente: "}
              <Link
                href={`/pages/users/${latestActivity.actor.slug}`}
                className="text-primary-600 underline"
              >
                {latestActivity.actor.first_name} {latestActivity.actor.last_name}
              </Link>
              {" — "}
              {translateActivityLabel(latestActivity.label)}
              {" — "}
              <span>
                {format(new Date(latestActivity.created_at), "d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
            </>
          ) : (
            <>
              {" Atividade mais recente: "}
              {dataset.owner && (
                <>
                  <Link
                    href={`/pages/users/${dataset.owner.slug}`}
                    className="text-primary-600 underline"
                  >
                    {dataset.owner.first_name} {dataset.owner.last_name}
                  </Link>
                </>
              )}
              {" — editou o conjunto de dados — "}
              <span>
                {format(new Date(dataset.last_modified), "d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
            </>
          )}
        </p>
      </div>

      <div ref={tabsRef} tabIndex={-1} className="outline-none">
      <Tabs
        onTabActivation={(index: number) => {
          setApiError(null);
          setApiSuccess(null);
          if (index === 2) loadDiscussions();
          if (index === 3) loadActivities();
        }}
      >
        {/* Metadata Tab */}
        <Tab>
          <TabHeader>Metadados</TabHeader>
          <TabBody>
            <DatasetsEditMetadataTab
              dataset={dataset}
              featured={featured}
              isSubmitting={isSubmitting}
              formErrors={formErrors}
              loadedTitle={loadedTitle}
              loadedAcronym={loadedAcronym}
              description={description}
              loadedKeywords={loadedKeywords}
              selectedKeywords={selectedKeywords}
              keywordOptions={keywordOptions}
              loadedLicense={loadedLicense}
              licenseOptions={licenseOptions}
              loadedFrequency={frequencyDefaultValue}
              frequencyOptions={frequencyOptions}
              temporalStart={temporalStart}
              temporalEnd={temporalEnd}
              loadedSpatialZones={loadedSpatialZones}
              spatialCoverageValue={selectedSpatialZonesValue}
              spatialCoverageOptions={spatialCoverageOptions}
              selectedZoneObjects={selectedZoneObjects}
              effectiveSpatialIds={effectiveSpatialIds}
              loadedSpatialGranularity={loadedSpatialGranularity}
              spatialGranularityOptions={spatialGranularityOptions}
              keywordsRef={keywordsRef}
              selectedLicenseRef={selectedLicenseRef}
              selectedFrequencyRef={selectedFrequencyRef}
              spatialCoverageRef={spatialCoverageRef}
              spatialGranularityRef={spatialGranularityRef}
              onPublishDataset={async () => {
                try {
                  const tagsValue = keywordsRef.current;
                  const tags = tagsValue
                    ? tagsValue
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    : dataset.tags || [];
                  const updated = await updateDataset(dataset.id, {
                    private: false,
                    title: dataset.title,
                    description: dataset.description,
                    description_short: dataset.description_short || undefined,
                    acronym: dataset.acronym || undefined,
                    tags,
                    license: dataset.license || undefined,
                    frequency: dataset.frequency || undefined,
                    temporal_coverage: dataset.temporal_coverage || undefined,
                    spatial: dataset.spatial || undefined,
                    organization: dataset.organization?.id,
                  });
                  setDataset(updated);
                  setApiSuccess("Conjunto de dados publicado com sucesso.");
                  setTimeout(() => setApiSuccess(null), 10000);
                } catch {
                  setApiError("Erro ao publicar o conjunto de dados.");
                }
              }}
              onFeaturedChange={(checked) => setFeatured(checked)}
              onTitleChange={handleTitleChange}
              onAcronymChange={setAcronym}
              onDescriptionChange={(html) => {
                setDescription(html);
                if (html.trim()) clearError("description");
              }}
              onKeywordSearch={(q) => {
                setKeywordSearch(q);
                if (!q) {
                  setTagSearch([]);
                  return;
                }
                suggestTags(q, 20).then(setTagSearch);
              }}
              onKeywordsChange={(value) => {
                setLoadedKeywords(value);
                const selected = value.split(",").filter(Boolean);
                let addedNew = false;
                selected.forEach((v) => {
                  const lower = v.toLowerCase();
                  const existsInSuggestions = tagSuggestions.some((t) => t.text.toLowerCase() === lower);
                  const existsInSearch = tagSearch.some((t) => t.text.toLowerCase() === lower);
                  if (!existsInSuggestions && !existsInSearch) {
                    addedNew = true;
                    setTagSuggestions((prev) => {
                      if (prev.some((t) => t.text.toLowerCase() === lower)) return prev;
                      return [...prev, { text: v }];
                    });
                  }
                });
                if (addedNew) setKeywordSearch("");
              }}
              onRemoveKeyword={(keyword) => {
                const next = selectedKeywords
                  .filter((v) => v.toLowerCase() !== keyword.toLowerCase())
                  .join(",");
                setLoadedKeywords(next);
                keywordsRef.current = next;
              }}
              onTemporalStartChange={setTemporalStart}
              onTemporalEndChange={setTemporalEnd}
              onSpatialCoverageChange={handleSpatialCoverageChange}
              onSpatialSearch={(q) => {
                if (q.length < 2) {
                  spatialZoneSearchRef.current = [];
                  setSpatialZoneSearch([]);
                  return;
                }
                suggestSpatialZones(q, 50)
                  .then((results) => {
                    spatialZoneSearchRef.current = results;
                    setSpatialZoneSearch(results);
                  })
                  .catch(() => {
                    spatialZoneSearchRef.current = [];
                    setSpatialZoneSearch([]);
                  });
              }}
              onRemoveSpatialZone={(zoneId) => {
                const next = effectiveSpatialIds.filter((id) => id !== zoneId).join(",");
                setSelectedSpatialZonesValue(next);
                spatialCoverageRef.current = next;
                setSpatialZones((prev) => prev.filter((z) => z.id !== zoneId));
              }}
              onSaveMetadata={handleSaveMetadata}
              onToggleArchive={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dataset.archived ? handleUnarchiveDataset() : handleArchiveDataset();
              }}
              onOpenDeletePopup={(e) => {
                e.preventDefault();
                e.stopPropagation();
                show(
                  <DatasetsEditDeletePopup onClose={hide} onConfirm={handleDeleteDataset} />,
                  {
                    title: "Elimine o conjunto de dados",
                    closeAriaLabel: "Fechar",
                    dimensions: "m",
                  },
                );
              }}
            />
          </TabBody>
        </Tab>

        {/* Resources Tab */}
        <Tab>
          <TabHeader>Ficheiros ({dataset.resources.length})</TabHeader>
          <TabBody>
            <DatasetsEditResourcesTab
              dataset={dataset}
              uploaderKey={uploaderKey}
              fileUploadError={fileUploadError}
              isSubmitting={isSubmitting}
              onFileUpload={handleFileUpload}
              onSecurityError={() => setFileUploadError(POISONED_FILE_WARNING)}
              onResourceClick={handleResourceClick}
              onResourceEdit={handleResourceEdit}
              onDeleteResource={handleDeleteResource}
            />
          </TabBody>
        </Tab>

        {/* Discussions Tab */}
        <Tab>
          <TabHeader>Discussões ({discussionsTotal ?? 0})</TabHeader>
          <TabBody>
            <DatasetsEditDiscussionsTab
              discussionsLoading={discussionsLoading}
              discussionsLoaded={discussionsLoaded}
              discussions={discussions}
            />
          </TabBody>
        </Tab>

        {/* Activities Tab */}
        <Tab>
          <TabHeader>Atividades</TabHeader>
          <TabBody>
            <DatasetsEditActivitiesTab
              activitiesLoading={activitiesLoading}
              activitiesLoaded={activitiesLoaded}
              activities={activities}
              translateActivityLabel={translateActivityLabel}
            />
          </TabBody>
        </Tab>
      </Tabs>
      </div>
    </div>
  );
}

