"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Tabs, Tab, TabHeader, TabBody } from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import {
  fetchHomeFeaturedDatasets,
  updateHomeFeaturedDatasets,
  fetchHomeFeaturedReuses,
  updateHomeFeaturedReuses,
} from "@/service/api/system";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import type {
  ContentBlock,
  FeaturedDatasetsData,
  FeaturedReusesData,
} from "./editorial-blocks";
import { EditorialBlockList } from "./EditorialBlockUI";

export default function SystemEditorialClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [datasetBlocks, setDatasetBlocks] = useState<ContentBlock[]>([]);
  const [reuseBlocks, setReuseBlocks] = useState<ContentBlock[]>([]);
  const [, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {
    message: saveMessage,
    setTemporaryMessage: showSaveMessage,
  } = useTemporaryMessage<{
    type: "success" | "error";
    text: string;
  } | null>(null, 4000);
  const [datasetNameMap, setDatasetNameMap] = useState<Record<string, Dataset>>({});
  const [reuseNameMap, setReuseNameMap] = useState<Record<string, Reuse>>({});
  const initialDatasetsRef = useRef<Dataset[]>([]);
  const initialReusesRef = useRef<Reuse[]>([]);

  useEffect(() => {
    async function loadFeatured() {
      setIsLoading(true);
      try {
        const [datasets, reuses] = await Promise.all([
          fetchHomeFeaturedDatasets(),
          fetchHomeFeaturedReuses(),
        ]);
        initialDatasetsRef.current = datasets;
        initialReusesRef.current = reuses;

        const dsMap: Record<string, Dataset> = {};
        datasets.forEach((dataset) => {
          dsMap[dataset.id] = dataset;
        });
        setDatasetNameMap(dsMap);

        const rMap: Record<string, Reuse> = {};
        reuses.forEach((reuse) => {
          rMap[reuse.id] = reuse;
        });
        setReuseNameMap(rMap);

        if (datasets.length > 0) {
          setDatasetBlocks([
            {
              id: crypto.randomUUID(),
              type: "featured-datasets",
              data: {
                title: "",
                legend: "",
                datasetIds: datasets.map((dataset) => dataset.id),
              } as FeaturedDatasetsData,
            },
          ]);
        }

        if (reuses.length > 0) {
          setReuseBlocks([
            {
              id: crypto.randomUUID(),
              type: "featured-reuses",
              data: {
                title: "",
                legend: "",
                reuseIds: reuses.map((reuse) => reuse.id),
              } as FeaturedReusesData,
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading featured content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadFeatured();
  }, []);

  const handleSave = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsSaving(true);

    try {
      const datasetIds = datasetBlocks
        .filter((block) => block.type === "featured-datasets")
        .flatMap((block) => (block.data as FeaturedDatasetsData).datasetIds);
      const reuseIds = reuseBlocks
        .filter((block) => block.type === "featured-reuses")
        .flatMap((block) => (block.data as FeaturedReusesData).reuseIds);

      await Promise.all([
        updateHomeFeaturedDatasets(datasetIds),
        updateHomeFeaturedReuses(reuseIds),
      ]);

      setHasChanges(false);
      showSaveMessage({ type: "success", text: "Alterações guardadas." });
    } catch (error) {
      console.error("Error saving:", error);
      showSaveMessage({ type: "error", text: "Erro ao guardar alterações." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const datasets = initialDatasetsRef.current;
    const reuses = initialReusesRef.current;

    setDatasetBlocks(
      datasets.length > 0
        ? [
            {
              id: crypto.randomUUID(),
              type: "featured-datasets" as const,
              data: {
                title: "",
                legend: "",
                datasetIds: datasets.map((dataset) => dataset.id),
              } as FeaturedDatasetsData,
            },
          ]
        : []
    );

    setReuseBlocks(
      reuses.length > 0
        ? [
            {
              id: crypto.randomUUID(),
              type: "featured-reuses" as const,
              data: {
                title: "",
                legend: "",
                reuseIds: reuses.map((reuse) => reuse.id),
              } as FeaturedReusesData,
            },
          ]
        : []
    );

    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <AdminLayout
        breadcrumbItems={[
          { label: "Administração", url: "/admin" },
          { label: "Editorial", url: "/admin/system/editorial" },
        ]}
        title="Editorial"
        headerAction={
          <div className="flex items-center gap-8">
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-eye"
              leadingIconHover="agora-solid-eye"
              disabled
            >
              Veja a página pública
            </Button>
            <Button
              variant="primary"
              hasIcon
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
              disabled
            >
              Editar na página pública
            </Button>
          </div>
        }
      >
        <p className="text-neutral-500">A carregar...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: "Editorial", url: "/admin/system/editorial" },
      ]}
      title="Editorial"
      headerAction={
        <div className="flex items-center gap-8">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-eye"
              leadingIconHover="agora-solid-eye"
            >
              Veja a página pública
            </Button>
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              hasIcon
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
            >
              Editar na página pública
            </Button>
          </a>
        </div>
      }
    >
      {saveMessage && (
        <div
          className={`text-sm mb-16 rounded-8 p-12 ${
            saveMessage.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <Tabs>
        <Tab active>
          <TabHeader>Conjuntos de dados</TabHeader>
          <TabBody>
            <div className="py-24">
              <EditorialBlockList
                blocks={datasetBlocks}
                setBlocks={setDatasetBlocks}
                setHasChanges={setHasChanges}
                datasetNameMap={datasetNameMap}
                onDatasetNameMapUpdate={(dataset) =>
                  setDatasetNameMap((prev) => ({ ...prev, [dataset.id]: dataset }))
                }
              />
              {datasetBlocks.length > 0 && (
                <div className="mt-16 flex justify-end gap-8 pt-16">
                  <Button appearance="outline" variant="primary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-check-circle"
                    leadingIconHover="agora-solid-check-circle"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </TabBody>
        </Tab>
        <Tab>
          <TabHeader>Reutilizar</TabHeader>
          <TabBody>
            <div className="py-24">
              <EditorialBlockList
                blocks={reuseBlocks}
                setBlocks={setReuseBlocks}
                setHasChanges={setHasChanges}
                reuseNameMap={reuseNameMap}
                onReuseNameMapUpdate={(reuse) =>
                  setReuseNameMap((prev) => ({ ...prev, [reuse.id]: reuse }))
                }
              />
              {reuseBlocks.length > 0 && (
                <div className="mt-16 flex justify-end gap-8 pt-16">
                  <Button appearance="outline" variant="primary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-check-circle"
                    leadingIconHover="agora-solid-check-circle"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
