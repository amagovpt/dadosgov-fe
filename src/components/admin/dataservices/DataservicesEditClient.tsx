"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  InputText,
  InputTextArea,
  RadioButton,
  Icon,
  StatusCard,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataservicesEditDeletePopup from "@/components/admin/dataservices/DataservicesEditDeletePopup";
import {
  fetchDataservice,
  updateDataservice,
  deleteDataservice,
} from "@/service/api/dataservices";
import type { Dataservice } from "@/service/types/dataservice";

const ACCESS_TYPES = [
  { value: "open", label: "Download gratuito" },
  { value: "open_with_account", label: "Aberto sob certas condições" },
  { value: "restricted", label: "Acesso mediante autorização" },
];

export default function DataservicesEditClient() {
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const searchParams = useSearchParams();
  const idOrSlug = searchParams.get("id") || searchParams.get("slug") || "";

  const [dataservice, setDataservice] = useState<Dataservice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [baseApiUrl, setBaseApiUrl] = useState("");
  const [machineDocUrl, setMachineDocUrl] = useState("");
  const [technicalDocUrl, setTechnicalDocUrl] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  const [authRequestUrl, setAuthRequestUrl] = useState("");
  const [rateLimiting, setRateLimiting] = useState("");
  const [availability, setAvailability] = useState("");
  const [accessType, setAccessType] = useState("open");

  useEffect(() => {
    async function load() {
      if (!idOrSlug) {
        setIsLoading(false);
        return;
      }
      try {
        const d = await fetchDataservice(idOrSlug);
        setDataservice(d);
        setTitle(d.title || "");
        setAcronym(d.acronym || "");
        setDescription(d.description || "");
        setBaseApiUrl(d.base_api_url || "");
        setMachineDocUrl(d.machine_documentation_url || "");
        setTechnicalDocUrl(d.technical_documentation_url || "");
        setBusinessDocUrl(d.business_documentation_url || "");
        setAuthRequestUrl(d.authorization_request_url || "");
        setRateLimiting(d.rate_limiting || "");
        setAvailability(d.availability != null ? String(d.availability) : "");
        setAccessType(d.access_type || "open");
      } catch (error) {
        console.error("Error loading dataservice:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [idOrSlug]);

  const handleSave = async () => {
    if (!dataservice) return;
    setIsSaving(true);
    setApiError(null);
    try {
      await updateDataservice(dataservice.id, {
        title: title.trim(),
        acronym: acronym.trim() || undefined,
        description: description.trim(),
        base_api_url: baseApiUrl.trim() || undefined,
        machine_documentation_url: machineDocUrl.trim() || undefined,
        technical_documentation_url: technicalDocUrl.trim() || undefined,
        business_documentation_url: businessDocUrl.trim() || undefined,
        authorization_request_url: authRequestUrl.trim() || undefined,
        rate_limiting: rateLimiting.trim() || undefined,
        availability: availability.trim() ? parseFloat(availability) : undefined,
        access_type: accessType,
      });
      router.push(`/pages/dataservices/${dataservice.slug}`);
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      setApiError(
        err?.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "Erro ao guardar. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!dataservice) return;
    setIsSaving(true);
    try {
      const updated = await updateDataservice(dataservice.id, {
        archived_at: dataservice.archived_at ? null : new Date().toISOString(),
      });
      setDataservice(updated);
    } catch (error) {
      console.error("Error archiving dataservice:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!dataservice) return;
    hide();
    setIsSaving(true);
    try {
      await deleteDataservice(dataservice.id);
      router.push("/pages/admin/me/dataservices");
    } catch (error) {
      console.error("Error deleting dataservice:", error);
      setIsSaving(false);
    }
  };

  const handleOpenDeletePopup = () => {
    if (!dataservice) return;
    show(<DataservicesEditDeletePopup onClose={hide} onConfirm={confirmDelete} />, {
      title: "Elimine a API",
      closeAriaLabel: "Fechar",
      dimensions: "m",
    });
  };

  return (
    <AdminLayout
      title="Editar API"
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "API", url: "/pages/admin/dataservices" },
        { label: dataservice?.title || "Editar", url: "#" },
      ]}
      headerAction={
        <Button
          variant="primary"
          appearance="outline"
          disabled={!!(dataservice?.archived_at || dataservice?.deleted_at)}
          onClick={() =>
            dataservice && window.open(`/pages/dataservices/${dataservice.slug}`, "_blank")
          }
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="h-16 w-16" />
            Ver página API
          </span>
        </Button>
      }
    >
      {isLoading ? null : !dataservice ? (
        <p className="text-neutral-500">API não encontrada.</p>
      ) : (
        <div className="flex max-w-[720px] flex-col gap-24">
          {apiError && <p className="text-red-600">{apiError}</p>}
          <InputText
            label="Nome da API"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          />
          <InputText
            label="Acrónimo"
            value={acronym}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcronym(e.target.value)}
          />
          <InputTextArea
            label="Descrição"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          />
          <InputText
            label="URL base da API"
            value={baseApiUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseApiUrl(e.target.value)}
          />
          <InputText
            label="Documentação técnica (machine-readable)"
            value={machineDocUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMachineDocUrl(e.target.value)}
          />
          <InputText
            label="Documentação técnica"
            value={technicalDocUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechnicalDocUrl(e.target.value)}
          />
          <InputText
            label="Documentação de negócio"
            value={businessDocUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessDocUrl(e.target.value)}
          />
          <InputText
            label="URL de pedido de autorização"
            value={authRequestUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthRequestUrl(e.target.value)}
          />
          <InputText
            label="Limites de uso (rate limiting)"
            value={rateLimiting}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateLimiting(e.target.value)}
          />
          <InputText
            label="Disponibilidade (%)"
            value={availability}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvailability(e.target.value)}
          />
          <fieldset className="flex flex-col gap-8">
            <legend className="text-m-semibold mb-8">Método de acesso</legend>
            {ACCESS_TYPES.map((opt) => (
              <RadioButton
                key={opt.value}
                name="access_type"
                value={opt.value}
                checked={accessType === opt.value}
                onChange={() => setAccessType(opt.value)}
              >
                {opt.label}
              </RadioButton>
            ))}
          </fieldset>
          <div className="admin-page__actions flex justify-end gap-16">
            <Button appearance="outline" variant="neutral" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>

          <div className="dataset-edit-danger-actions">
            <StatusCard
              variant="warning"
              showIcon
              description={
                <>
                  <strong>
                    {dataservice.archived_at
                      ? "Esta API está arquivada. Pode desarquivar para voltar a indexá-la no portal."
                      : "Uma API arquivada deixa de estar indexada no portal, mas permanece acessível através de um link direto."}
                  </strong>
                  <br />
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleArchive}
                    disabled={isSaving}
                  >
                    {dataservice.archived_at ? "Desarquivar a API" : "Arquivar a API"}
                  </Button>
                </>
              }
            />
            <StatusCard
              variant="danger"
              showIcon
              description={
                <>
                  <strong>Atenção esta ação é irreversível.</strong>
                  <br />
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleOpenDeletePopup}
                    disabled={isSaving}
                  >
                    Eliminar a API
                  </Button>
                </>
              }
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
