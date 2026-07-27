import { useEffect, useRef, useState } from "react";
import { CardGeneral, Icon, ProgressBar, usePopupContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { searchDatasets } from "@/service/api/search";
import type { Dataset } from "@/service/types/dataset";
import type { FeaturedDatasetsData } from "../editorial-blocks";
import { DeleteBlockPopupContent } from "./DeleteBlockPopupContent";
import { formatCompactMetric, getTimeAgoLabel } from "./utils";

export function FeaturedDatasetsEditor({
  data,
  onChange,
  nameMap,
  onNameMapUpdate,
}: {
  data: FeaturedDatasetsData;
  onChange: (d: FeaturedDatasetsData) => void;
  nameMap?: Record<string, Dataset>;
  onNameMapUpdate?: (dataset: Dataset) => void;
}) {
  const { t, i18n } = useTranslation(["admin-common", "admin-editorial"]);
  const { show, hide } = usePopupContext();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Dataset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleRemoveDataset = (index: number) => {
    show(
      <DeleteBlockPopupContent
        onClose={hide}
        onConfirm={() => {
          hide();
          onChange({ ...data, datasetIds: data.datasetIds.filter((_, i) => i !== index) });
        }}
        message={t("admin-editorial:featuredDatasets.removeMessage")}
      />,
      {
        title: t("admin-editorial:featuredDatasets.removeTitle"),
        closeAriaLabel: t("admin-common:fileUpload.popup.close"),
        dimensions: "m",
      }
    );
  };

  useEffect(() => {
    if (!showSearch) return;
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length < 2) {
      const clearId = window.setTimeout(() => setSearchResults([]), 0);
      return () => window.clearTimeout(clearId);
    }
    searchTimeoutRef.current = setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        try {
          const response = await searchDatasets(searchQuery, 1, 8);
          setSearchResults(response.data.filter((d) => !data.datasetIds.includes(d.id)));
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, data.datasetIds]);

  const handleSelectDataset = (dataset: Dataset) => {
    onChange({ ...data, datasetIds: [...data.datasetIds, dataset.id] });
    onNameMapUpdate?.(dataset);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="rounded-8 bg-white py-24">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder={t("admin-editorial:featuredDatasets.titlePlaceholder")}
        className="text-xl mb-4 w-full border-none font-bold text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />
      <input
        type="text"
        value={data.legend}
        onChange={(e) => onChange({ ...data, legend: e.target.value })}
        placeholder={t("admin-editorial:featuredDatasets.legendPlaceholder")}
        className="text-sm mb-[20px] w-full border-none text-neutral-900 outline-none placeholder:text-neutral-900 placeholder:opacity-100"
      />

      <div className="grid grid-cols-2 gap-16">
        {data.datasetIds.map((id, index) => {
          const dataset = nameMap?.[id];
          const qualityScore =
            dataset?.quality?.score != null ? Math.round(dataset.quality.score * 100) : 0;
          const timeAgo = getTimeAgoLabel(dataset?.last_modified, i18n.resolvedLanguage);

          return (
            <div key={id} className="relative">
              <div className="card-general-listing flex h-full flex-col overflow-hidden rounded-4">
                <CardGeneral
                  variant="white"
                  image={{
                    src: dataset?.organization?.logo || "/images/placeholders/organization.png",
                    alt: dataset?.organization?.name || t("admin-editorial:featuredDatasets.organizationFallback"),
                    height: "56px",
                    className: "bg-primary-100 !object-contain !h-[56px]",
                  }}
                  subtitleText={
                    (
                      <div className="flex flex-col">
                        <span style={{ fontSize: "16px" }} className="text-neutral-900">
                          {timeAgo}
                        </span>
                        <span
                          style={{ fontSize: "16px", fontWeight: 300 }}
                          className="mt-4 text-neutral-900"
                        >
                          {dataset?.organization?.name || t("admin-editorial:featuredDatasets.noOrganization")}
                        </span>
                      </div>
                    ) as unknown as string
                  }
                  titleText={dataset?.title || id}
                  descriptionText={
                    (
                      <div className="flex grow flex-col">
                        <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                          {dataset?.description}
                        </p>
                        <div
                          className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}
                        >
                          <ProgressBar
                            value={qualityScore}
                            max={100}
                            hideLabel={true}
                            hidePercentageValue={true}
                          />
                          <span className="mt-4 block text-s-regular text-neutral-900">
                            {qualityScore}% {t("admin-editorial:featuredDatasets.metadataQuality")}
                          </span>
                          <div className="text-xs mt-12 flex flex-wrap items-center gap-8 text-neutral-700">
                            <div className="flex items-center gap-8" title={t("admin-editorial:featuredDatasets.views")}>
                              <Icon
                                name="agora-solid-eye"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>{formatCompactMetric(dataset?.metrics?.views, i18n.resolvedLanguage)}</span>
                            </div>
                            <div className="flex items-center gap-8" title={t("admin-editorial:featuredDatasets.downloads")}>
                              <Icon
                                name="agora-solid-download"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>
                                {formatCompactMetric(dataset?.metrics?.resources_downloads, i18n.resolvedLanguage)}
                              </span>
                            </div>
                            <div className="flex items-center gap-8" title={t("admin-editorial:featuredDatasets.reuses")}>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="h-16 w-16 fill-neutral-700"
                                aria-hidden="true"
                              >
                                <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
                              </svg>
                              <span>{dataset?.metrics?.reuses || 0}</span>
                            </div>
                            <div className="flex items-center gap-8" title={t("admin-editorial:featuredDatasets.favorites")}>
                              <Icon
                                name="agora-solid-star"
                                dimensions="xs"
                                className="fill-neutral-700"
                                aria-hidden="true"
                              />
                              <span>{formatCompactMetric(dataset?.metrics?.followers, i18n.resolvedLanguage)}</span>
                            </div>
                          </div>
                          <div className="mt-16 flex items-center gap-8 text-primary-600">
                            <Icon
                              name="agora-line-arrow-right-circle"
                              className="h-32 w-32"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </div>
                    ) as unknown as string
                  }
                  isBlockedLink={true}
                  anchor={{ href: dataset?.slug ? `/datasets/${dataset.slug}` : "#" }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDataset(index)}
                className="rounded group absolute right-8 top-8 z-10 p-4"
                title={t("admin-editorial:blockActions.remove")}
              >
                <Icon
                  name="agora-line-trash"
                  className="block h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:hidden"
                />
                <Icon
                  name="agora-solid-trash"
                  className="hidden h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:block"
                />
              </button>
            </div>
          );
        })}
      </div>

      {data.datasetIds.length < 6 && !showSearch && (
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="mt-16 flex w-full items-center justify-center gap-8 rounded-8 border-2 border-dashed border-neutral-300 py-16 text-neutral-900 transition-colors hover:border-neutral-400"
        >
          <Icon name="agora-line-plus-circle" className="h-[20px] w-[20px]" />
          <span className="text-xs">{t("admin-editorial:featuredDatasets.add")}</span>
        </button>
      )}

      {showSearch && (
        <div ref={searchContainerRef} className="relative mt-8 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("admin-editorial:featuredDatasets.searchPlaceholder")}
            className="text-sm w-full rounded-8 border border-neutral-300 px-12 py-[10px] outline-none focus:border-primary-500"
            autoFocus
          />
          {isSearching && <p className="text-xs mt-4 text-neutral-400">{t("admin-editorial:featuredDatasets.searching")}</p>}
          {searchResults.length > 0 && (
            <ul className="shadow-lg absolute z-10 mt-4 max-h-[240px] w-full overflow-y-auto rounded-8 border border-neutral-200 bg-white">
              {searchResults.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectDataset(d)}
                    className="text-sm w-full px-12 py-8 text-left transition-colors hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-800">{d.title}</span>
                    {d.organization?.name && (
                      <span className="ml-8 text-neutral-400">— {d.organization.name}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <p className="text-xs mt-4 text-neutral-400">{t("admin-editorial:featuredDatasets.noResults")}</p>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
            className="text-xs mt-4 text-neutral-400 hover:text-neutral-600"
          >
            {t("admin-common:actions.cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
