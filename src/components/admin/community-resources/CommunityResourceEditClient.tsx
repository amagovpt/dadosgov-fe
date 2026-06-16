"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";
import AuxiliarList from "@/components/admin/AuxiliarList";
import AppIcon from "@/components/Primitives/AppIcon";
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
  buildSchemaItems,
  COMMUNITY_RESOURCE_FORMATS,
  renderDropdownSection,
} from "@/components/admin/community-resources/dropdownOptions";

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
    scrollToFirstError,
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
    const errors: Partial<Record<CommunityResourceEditField, boolean>> = {};

    if (!title.trim()) errors.title = true;
    if (!resourceUrl.trim()) errors.url = true;
    if (!selectedTypeRef.current) errors.type = true;
    if (!selectedFormatRef.current) errors.format = true;
    if (showChecksum && !checksumValue.trim()) errors.checksumValue = true;

    return errors;
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
    const nextValue = event.target.value;
    setResourceUrl(nextValue);
    if (nextValue.trim()) {
      clearError("url");
    }
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setTitle(nextValue);
    if (nextValue.trim()) {
      clearError("title");
    }
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
    const nextValue = event.target.value;
    setSchemaUrl(nextValue);
    if (nextValue) {
      selectedSchemaRef.current = "";
    }
  }

  function handleRemoveChecksum() {
    setShowChecksum(false);
    setChecksumType("");
    setChecksumValue("");
    selectedChecksumTypeRef.current = "";
    clearError("checksumValue");
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
      scrollToFirstError();
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
    () =>
      renderDropdownSection(
        "types",
        resourceTypes.map((type) => ({ value: type.id, label: type.label })),
        selectedType,
      ),
    [resourceTypes, selectedType],
  );

  const formatOptions = useMemo(() => {
    const currentFormat = format.toLowerCase();
    const allFormats =
      currentFormat && !COMMUNITY_RESOURCE_FORMATS.includes(currentFormat)
        ? [...COMMUNITY_RESOURCE_FORMATS, currentFormat]
        : COMMUNITY_RESOURCE_FORMATS;

    return renderDropdownSection(
      "formats",
      allFormats.map((item) => ({ value: item, label: item })),
      currentFormat,
    );
  }, [format]);

  const schemaOptions = useMemo(
    () => renderDropdownSection("schemas", buildSchemaItems(schemas, loadedSchema), loadedSchema),
    [schemas, loadedSchema],
  );

  const auxiliarItems = [
    {
      title: "Escolher o link correto",
      hasError: hasError("url"),
      content:
        "É recomendável criar um link para o próprio arquivo em vez de uma página da web para permitir que o site o analise.",
    },
    {
      title: "Soma de verificação",
      content:
        "O checksum permite ao utilizador verificar se os dados descarregados não foram corrompidos ou alterados.",
    },
    {
      title: "Dê um nome ao arquivo",
      hasError: hasError("title"),
      content: (
        <>
          Recomenda-se a escolha de um título que informe claramente qualquer utilizador sobre o
          conteúdo do arquivo. Algumas práticas a evitar:
          <ul className="mt-8 list-disc pl-16">
            <li>atribuir um título muito genérico (por exemplo, &quot;list.csv&quot;);</li>
            <li>dar um título muito longo dificultaria a manipulação do arquivo;</li>
            <li>
              fornecer um título que contenha acentos ou caracteres especiais (problemas de
              interoperabilidade de arquivos);
            </li>
            <li>
              dar um título que seja demasiado técnico e derivado de nomenclaturas da indústria.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Publique os tipos de ficheiros corretos.",
      hasError: hasError("type"),
      content: (
        <>
          Pode escolher entre os seguintes tipos:
          <ul className="mt-8 list-disc pl-16">
            <li>Ficheiros principais</li>
            <li>Documentação</li>
            <li>Atualização</li>
            <li>API</li>
            <li>Código-fonte</li>
            <li>Outro</li>
          </ul>
        </>
      ),
    },
    {
      title: "Adicionar documentação",
      content: (
        <>
          A descrição de um ficheiro facilita a reutilização de dados. Inclui, entre outras coisas:
          <ul className="mt-8 list-disc pl-16">
            <li>uma descrição geral do conjunto de dados;</li>
            <li>uma descrição do método de produção de dados;</li>
            <li>uma descrição do modelo de dados;</li>
            <li>uma descrição do esquema de dados;</li>
            <li>uma descrição dos metadados;</li>
            <li>uma descrição das principais alterações.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Escolher o formato certo",
      content: (
        <>
          Os formatos devem ser:
          <ul className="mt-8 list-disc pl-16">
            <li>
              aberto: um formato aberto não adiciona especificações técnicas que restrinjam o uso
              dos dados (por exemplo, o uso de software pago);
            </li>
            <li>
              facilmente reutilizável: um formato facilmente reutilizável implica que qualquer
              pessoa ou servidor pode reutilizar facilmente o conjunto de dados;
            </li>
            <li>
              utilizável num sistema de processamento automatizado: um sistema de processamento
              automatizado permite operações automáticas relacionadas ao processamento de dados (por
              exemplo, um ficheiro CSV é facilmente utilizável por um sistema automatizado, ao
              contrário de um ficheiro PDF).
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Escolher um tipo de recurso",
      content:
        "Especifique o tipo de recurso correspondente ao formato do recurso remoto (por exemplo, application/pdf, text/csv). Se necessário, utilize uma ferramenta online para detetá-lo.",
    },
    {
      title: "Selecione um esquema",
      content:
        "É possível identificar um esquema de dados existente ao visitar o site schema.data.gouv.fr, que contém uma lista de esquemas de dados existentes.",
    },
  ];

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
          {successMessage && (
            <div className="mb-16">
              <StatusCard variant="success" showIcon description={successMessage} />
            </div>
          )}

          {apiError && (
            <div className="mb-16">
              <StatusCard variant="danger" showIcon description={apiError} />
            </div>
          )}

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

            <h2 className="admin-page__section-title">Reutilização</h2>

            <div className="admin-page__fields-group">
              <InputText
                label="Link exato para o ficheiro *"
                placeholder="Insira o link para o ficheiro"
                id="resource-url"
                value={resourceUrl}
                onChange={handleResourceUrlChange}
                hasError={hasError("url")}
                hasFeedback={hasError("url")}
                feedbackState="danger"
                errorFeedbackText="Campo obrigatório"
              />
            </div>

            <div className="flex flex-col items-start gap-12">
              <h2 className="admin-page__section-title mb-0">Selo de verificação</h2>
              {showChecksum ? (
                <Button
                  variant="danger"
                  appearance="outline"
                  hasIcon
                  leadingIcon="agora-line-trash"
                  leadingIconHover="agora-solid-trash"
                  onClick={handleRemoveChecksum}
                >
                  Eliminar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon
                  leadingIcon="agora-line-plus"
                  leadingIconHover="agora-solid-plus"
                  onClick={() => setShowChecksum(true)}
                >
                  Adicionar
                </Button>
              )}
            </div>

            {showChecksum && (
              <div className="admin-page__fields-group">
                <AdminSelectAdapter
                  key={`checksum-${resource.id}-${saveCount}`}
                  label="Tipo de soma de verificação"
                  placeholder="SHA1"
                  id="checksum-type"
                  initialValue={checksumType}
                  valueRef={selectedChecksumTypeRef}
                  onValueChange={(value) => {
                    if (value !== checksumType) {
                      setChecksumType(value);
                      setChecksumValue("");
                    }
                  }}
                >
                  <DropdownSection name="checksum-types">
                    <DropdownOption value="sha1" selected={checksumType === "sha1"}>
                      SHA1
                    </DropdownOption>
                    <DropdownOption value="sha256" selected={checksumType === "sha256"}>
                      SHA256
                    </DropdownOption>
                    <DropdownOption value="md5" selected={checksumType === "md5"}>
                      MD5
                    </DropdownOption>
                    <DropdownOption value="crc" selected={checksumType === "crc"}>
                      CRC
                    </DropdownOption>
                  </DropdownSection>
                </AdminSelectAdapter>

                <InputText
                  label="Valor de checksum *"
                  placeholder="Introduza o valor do hash"
                  id="checksum-value"
                  value={checksumValue}
                  onChange={handleChecksumValueChange}
                  hasError={hasError("checksumValue")}
                  hasFeedback={hasError("checksumValue")}
                  feedbackState="danger"
                  errorFeedbackText="Campo obrigatório"
                />
              </div>
            )}

            <h2 className="admin-page__section-title">Descrição</h2>

            <div className="admin-page__fields-group">
              <InputText
                label="Título *"
                placeholder="Insira o título aqui"
                id="resource-title"
                value={title}
                onChange={handleTitleChange}
                hasError={hasError("title")}
                hasFeedback={hasError("title")}
                feedbackState="danger"
                errorFeedbackText="Campo obrigatório"
              />

              <AdminSelectAdapter
                key={`type-${resource.id}-${resourceTypes.length}`}
                label="Tipo *"
                placeholder="Ficheiros principais"
                id="resource-type"
                initialValue={selectedType}
                valueRef={selectedTypeRef}
                onValueChange={clearTypeError}
                hasError={hasError("type")}
                errorMessage="Campo obrigatório"
                renderErrorBelow
              >
                {typeOptions}
              </AdminSelectAdapter>

              <InputTextArea
                label="Descrição"
                placeholder="Insira a descrição aqui"
                id="resource-description"
                rows={10}
                value={description}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(event.target.value)
                }
              />

              <AdminSelectAdapter
                key={`format-${resource.id}-${saveCount}`}
                label="Formato *"
                placeholder="Selecione o formato"
                id="resource-format"
                initialValue={format}
                valueRef={selectedFormatRef}
                onValueChange={clearFormatError}
                hasError={hasError("format")}
                errorMessage="Campo obrigatório"
                renderErrorBelow
              >
                {formatOptions}
              </AdminSelectAdapter>

              <InputText
                label="Tipo de recurso"
                placeholder="application/pdf"
                id="resource-mime"
                value={mimeType}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setMimeType(event.target.value)
                }
              />
            </div>

            <h2 className="admin-page__section-title">Esquema de dados</h2>

            <div className="admin-page__fields-group">
              <AdminSelectAdapter
                key={`schema-${resource.id}-${schemas.length}`}
                label="Plano"
                placeholder="Procure um esquema referenciado em dados.gov.pt..."
                id="resource-schema"
                searchable
                searchInputPlaceholder="Escreva para pesquisar..."
                initialValue={loadedSchema}
                valueRef={selectedSchemaRef}
                onValueChange={clearSchemaUrl}
              >
                {schemaOptions}
              </AdminSelectAdapter>

              <div className="admin-page__divider-or">
                <span className="admin-page__divider-or-text">ou</span>
              </div>

              <InputText
                label="Adicione um link para o diagrama"
                placeholder="Insira o link para o diagrama"
                id="resource-schema-url"
                value={schemaUrl}
                onChange={handleSchemaUrlChange}
              />
            </div>

            <div className="admin-page__actions flex gap-[18px]">
              <Button
                variant="primary"
                appearance="outline"
                hasIcon
                leadingIcon="agora-line-arrow-left-circle"
                leadingIconHover="agora-solid-arrow-left-circle"
                onClick={() => router.push("/pages/admin/system/community-resources")}
              >
                Anterior
              </Button>
              <Button
                type="submit"
                variant="primary"
                hasIcon
                trailingIcon="agora-line-check-circle"
                trailingIconHover="agora-solid-check-circle"
                disabled={isSubmitting}
              >
                {isSubmitting ? "A guardar..." : "Guardar"}
              </Button>
            </div>

            <div className="dataset-edit-danger-actions">
              <StatusCard
                variant="danger"
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
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      Eliminar o recurso comunitário
                    </Button>
                  </>
                }
              />
            </div>
          </form>
        </div>

        <aside className="admin-page__auxiliar">
          <div className="admin-page__auxiliar-inner">
            <div className="admin-page__auxiliar-header">
              <AppIcon name="agora-line-question-mark" className="h-24 w-24" />
              <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
            </div>
            <AuxiliarList items={auxiliarItems} />
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
