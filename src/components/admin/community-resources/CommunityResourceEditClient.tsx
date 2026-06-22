"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import {
  fetchCommunityResource,
  updateCommunityResource,
  deleteCommunityResource,
} from "@/service/api/community-resources";
import { fetchResourceTypes, fetchSchemas } from "@/service/api/datasets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useAsyncSubmit } from "@/hooks/forms/useAsyncSubmit";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import type { ResourceType } from "@/service/types/catalog";
import type { CommunityResource } from "@/service/types/community-resource";
import {
  buildChecksumTypeItems,
  buildFormatItems,
  buildResourceTypeItems,
  buildSchemaItems,
  renderDropdownSection,
} from "@/components/admin/community-resources/dropdownOptions";
import {
  handleRequiredTextFieldChange,
  handleSchemaUrlFieldChange,
  handleTextFieldChange,
} from "@/components/admin/community-resources/communityResourceFieldHandlers";
import { buildValidationErrors } from "@/components/admin/community-resources/communityResourceValidation";
import { getEditCommunityResourceAuxiliaryItems } from "@/components/admin/community-resources/communityResourceAuxiliaryContent";
import ResourceLinkSection from "@/components/admin/community-resources/ResourceLinkSection";
import ChecksumSection from "@/components/admin/community-resources/ChecksumSection";
import EditDescriptionSection from "@/components/admin/community-resources/EditDescriptionSection";
import EditSchemaSection from "@/components/admin/community-resources/EditSchemaSection";
import DangerZoneSection from "@/components/admin/community-resources/DangerZoneSection";
import FormStatusMessages from "@/components/admin/community-resources/FormStatusMessages";
import CommunityResourceAuxiliarySidebar from "@/components/admin/community-resources/CommunityResourceAuxiliarySidebar";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";

type CommunityResourceEditField =
  | "url"
  | "title"
  | "type"
  | "format"
  | "checksumValue";

export default function CommunityResourceEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  useCurrentUser();

  const resourceId =
    (params?.resourceId as string) ||
    searchParams.get("resource_id") ||
    searchParams.get("id") ||
    "";

  const [resource, setResource] = useState<CommunityResource | null>(null);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resourceUrl, setResourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [schemaUrl, setSchemaUrl] = useState("");
  const [loadedSchema, setLoadedSchema] = useState("");
  const [checksumType, setChecksumType] = useState("");
  const [checksumValue, setChecksumValue] = useState("");
  const [showChecksum, setShowChecksum] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  const selectedTypeRef = useRef("");
  const selectedFormatRef = useRef("");
  const selectedChecksumTypeRef = useRef("");
  const selectedSchemaRef = useRef("");

  const {
    hasError,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
  } = useFormErrors<CommunityResourceEditField>();

  const { isSubmitting, run } = useAsyncSubmit({
    clearError: () => setApiError(null),
    clearSuccess: () => setSuccessMessage(null),
    onError: (error) => {
      const normalized = normalizeApiError(error, "Erro ao atualizar recurso comunitário.");
      if (normalized.status === 401) {
        setApiError("Sessão expirada. Faça login novamente.");
        return;
      }
      setApiError(normalized.message || "Erro ao atualizar recurso comunitário.");
    },
    scrollToTopOnStart: true,
  });

  const clearTypeError = React.useCallback(() => {
    clearError("type");
  }, [clearError]);

  const clearFormatError = React.useCallback(() => {
    clearError("format");
  }, [clearError]);

  const clearSchemaUrl = React.useCallback(() => {
    setSchemaUrl("");
  }, []);

  const syncSchemaState = React.useCallback((schema?: CommunityResource["schema"] | null) => {
    if (schema?.url && schema.url.startsWith("http")) {
      setSchemaUrl(schema.url);
      setLoadedSchema("");
      selectedSchemaRef.current = "";
      return;
    }

    const selectedSchema = schema?.name || schema?.url || "";
    setLoadedSchema(selectedSchema);
    setSchemaUrl("");
    selectedSchemaRef.current = selectedSchema;
  }, []);

  function applyResourceToForm(nextResource: CommunityResource) {
    setResource(nextResource);
    setResourceUrl(nextResource.url || "");
    setTitle(nextResource.title);
    setDescription(nextResource.description || "");

    const normalizedFormat = nextResource.format?.toLowerCase() || "";
    setFormat(normalizedFormat);
    selectedFormatRef.current = normalizedFormat;

    const nextType = nextResource.type || "";
    setSelectedType(nextType);
    selectedTypeRef.current = nextType;

    setMimeType(nextResource.mime || "");
    syncSchemaState(nextResource.schema);

    if (nextResource.checksum) {
      const nextChecksumType = nextResource.checksum.type || "";
      setChecksumType(nextChecksumType);
      setChecksumValue(nextResource.checksum.value || "");
      selectedChecksumTypeRef.current = nextChecksumType;
      setShowChecksum(true);
      return;
    }

    setChecksumType("");
    setChecksumValue("");
    selectedChecksumTypeRef.current = "";
    setShowChecksum(false);
  }

  function getValidationErrors() {
    return buildValidationErrors<CommunityResourceEditField>({
      title: !title.trim(),
      url: !resourceUrl.trim(),
      type: !selectedTypeRef.current,
      format: !selectedFormatRef.current,
      checksumValue: showChecksum && !checksumValue.trim(),
    });
  }

  function buildSchemaPayload() {
    const schemaUrlValue = schemaUrl.trim();
    const schemaNameValue = selectedSchemaRef.current;

    return schemaUrlValue
      ? { url: schemaUrlValue }
      : schemaNameValue
        ? { name: schemaNameValue }
        : null;
  }

  function buildChecksumPayload() {
    if (!showChecksum) {
      return { checksum: null };
    }

    if (!checksumValue.trim()) {
      return {};
    }

    return {
      checksum: {
        type: selectedChecksumTypeRef.current || checksumType,
        value: checksumValue,
      },
    };
  }

  function buildUpdatePayload() {
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      url: resourceUrl.trim() || undefined,
      type: selectedTypeRef.current || undefined,
      format: selectedFormatRef.current.trim() || undefined,
      mime: mimeType.trim() || undefined,
      schema: buildSchemaPayload(),
      ...buildChecksumPayload(),
    };
  }

  function handleResourceUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleRequiredTextFieldChange(event, setResourceUrl, clearError, "url");
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleRequiredTextFieldChange(event, setTitle, clearError, "title");
  }

  function handleChecksumValueChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.nativeEvent.isTrusted) {
      return;
    }

    const nextValue = event.target.value;
    setChecksumValue(nextValue);
    if (nextValue.trim()) {
      clearError("checksumValue");
    }
  }

  function handleSchemaUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSchemaUrlFieldChange(event, setSchemaUrl, selectedSchemaRef);
  }

  function handleDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    handleTextFieldChange(event, setDescription);
  }

  function handleMimeTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleTextFieldChange(event, setMimeType);
  }

  function handleRemoveChecksum() {
    setShowChecksum(false);
    setChecksumType("");
    setChecksumValue("");
    selectedChecksumTypeRef.current = "";
    clearError("checksumValue");
  }

  function handleShowChecksum() {
    setShowChecksum(true);
  }

  function handleChecksumTypeChange(value: string) {
    if (value !== checksumType) {
      setChecksumType(value);
      setChecksumValue("");
    }
  }

  useEffect(() => {
    if (!resourceId) {
      return;
    }

    async function loadData() {
      setIsLoading(true);

      try {
        const [res, types, availableSchemas] = await Promise.all([
          fetchCommunityResource(resourceId),
          fetchResourceTypes(),
          fetchSchemas(),
        ]);

        applyResourceToForm(res);
        setResourceTypes(types);
        setSchemas(availableSchemas);
      } catch (error) {
        console.error("Error loading community resource:", error);
        setApiError("Erro ao carregar recurso comunitário.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [resourceId]);

  const handleSave = async () => {
    const errors = getValidationErrors();

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();

    await run(async () => {
      const updated = await updateCommunityResource(resourceId, buildUpdatePayload());
      applyResourceToForm(updated);
      setSaveCount((count) => count + 1);
      setSuccessMessage("Recurso comunitário atualizado com sucesso.");
      setTimeout(() => setSuccessMessage(null), 10000);
    });
  };

  const handleDelete = async () => {
    try {
      await deleteCommunityResource(resourceId);
      router.push("/pages/admin/system/community-resources");
    } catch {
      setApiError("Erro ao eliminar recurso comunitário.");
    }
  };

  const typeOptions = useMemo(
    () => renderDropdownSection("types", buildResourceTypeItems(resourceTypes), selectedType),
    [resourceTypes, selectedType],
  );

  const formatOptions = useMemo(
    () => renderDropdownSection("formats", buildFormatItems(format), format.toLowerCase()),
    [format],
  );

  const schemaOptions = useMemo(
    () => renderDropdownSection("schemas", buildSchemaItems(schemas, loadedSchema), loadedSchema),
    [schemas, loadedSchema],
  );

  const checksumOptions = useMemo(
    () => renderDropdownSection("checksum-types", buildChecksumTypeItems(), checksumType),
    [checksumType],
  );

  const auxiliarItems = getEditCommunityResourceAuxiliaryItems({
    hasUrlError: hasError("url"),
    hasTitleError: hasError("title"),
    hasTypeError: hasError("type"),
  });

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-600">A carregar...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="admin-page">
        <StatusCard
          variant="danger"
          showIcon
          description="Recurso comunitário não encontrado."
        />
      </div>
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/system/community-resources" },
        { label: "Editar" },
      ]}
      title="Metadados do arquivo"
      headerAction={null}
    >
      <div className="admin-page__body">
        <div className="admin-page__form-area">
          <FormStatusMessages successMessage={successMessage} errorMessage={apiError} />

          <form
            className="admin-page__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <p className="text-base leading-7 text-neutral-900">
              Os campos marcados com um asterisco ( * ) são obrigatórios.
            </p>

            <ResourceLinkSection
              resourceUrl={resourceUrl}
              hasUrlError={hasError("url")}
              onResourceUrlChange={handleResourceUrlChange}
            />

            <ChecksumSection
              resourceId={resource.id}
              saveCount={saveCount}
              showChecksum={showChecksum}
              checksumType={checksumType}
              checksumValue={checksumValue}
              checksumOptions={checksumOptions}
              selectedChecksumTypeRef={selectedChecksumTypeRef}
              hasChecksumValueError={hasError("checksumValue")}
              onShowChecksum={handleShowChecksum}
              onRemoveChecksum={handleRemoveChecksum}
              onChecksumTypeChange={handleChecksumTypeChange}
              onChecksumValueChange={handleChecksumValueChange}
            />

            <EditDescriptionSection
              resourceId={resource.id}
              saveCount={saveCount}
              resourceTypesCount={resourceTypes.length}
              title={title}
              description={description}
              format={format}
              selectedType={selectedType}
              mimeType={mimeType}
              typeOptions={typeOptions}
              formatOptions={formatOptions}
              selectedTypeRef={selectedTypeRef}
              selectedFormatRef={selectedFormatRef}
              hasTitleError={hasError("title")}
              hasTypeError={hasError("type")}
              hasFormatError={hasError("format")}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
              onMimeTypeChange={handleMimeTypeChange}
              onTypeChange={clearTypeError}
              onFormatChange={clearFormatError}
            />

            <EditSchemaSection
              resourceId={resource.id}
              schemasCount={schemas.length}
              loadedSchema={loadedSchema}
              schemaUrl={schemaUrl}
              schemaOptions={schemaOptions}
              selectedSchemaRef={selectedSchemaRef}
              onSchemaSelect={clearSchemaUrl}
              onSchemaUrlChange={handleSchemaUrlChange}
            />

            <AdminStepActions
              previousAction={{
                label: "Anterior",
                appearance: "outline",
                variant: "primary",
                hasIcon: true,
                leadingIcon: "agora-line-arrow-left-circle",
                leadingIconHover: "agora-solid-arrow-left-circle",
                onClick: () => router.push("/pages/admin/system/community-resources"),
              }}
              primaryAction={{
                label: isSubmitting ? "A guardar..." : "Guardar",
                type: "submit",
                hasIcon: true,
                trailingIcon: "agora-line-check-circle",
                trailingIconHover: "agora-solid-check-circle",
                disabled: isSubmitting,
              }}
            />

            <DangerZoneSection isSubmitting={isSubmitting} onDelete={handleDelete} />
          </form>
        </div>

        <CommunityResourceAuxiliarySidebar items={auxiliarItems} />
      </div>
    </AdminLayout>
  );
}
