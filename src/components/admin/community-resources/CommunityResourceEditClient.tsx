"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Breadcrumb,
  Button,
  InputText,
  InputTextArea,
  DropdownSection,
  DropdownOption,
  Icon,
  StatusCard,
} from "@ama-pt/agora-design-system";
import {
  fetchCommunityResource,
  updateCommunityResource,
  deleteCommunityResource,
  fetchResourceTypes,
  fetchSchemas,
} from "@/services/api";
import type { CommunityResource, ResourceType } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import AuxiliarList from "@/components/admin/AuxiliarList";

export default function CommunityResourceEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  useCurrentUser();
  const resourceId = (params?.resourceId as string) || searchParams.get("resource_id") || searchParams.get("id") || "";

  const [resource, setResource] = useState<CommunityResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Form state
  const [resourceUrl, setResourceUrl] = useState("");
  const [checksumType, setChecksumType] = useState("");
  const [checksumValue, setChecksumValue] = useState("");
  const [showChecksum, setShowChecksum] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [schemaUrl, setSchemaUrl] = useState("");
  const [schemas, setSchemas] = useState<string[]>([]);
  const [loadedSchema, setLoadedSchema] = useState("");
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const selectedTypeRef = useRef("");
  const selectedFormatRef = useRef("");
  const selectedChecksumTypeRef = useRef("");
  const selectedSchemaRef = useRef("");

  useEffect(() => {
    if (!resourceId) return;
    async function loadData() {
      setIsLoading(true);
      try {
        const [res, types, availableSchemas] = await Promise.all([
          fetchCommunityResource(resourceId),
          fetchResourceTypes(),
          fetchSchemas(),
        ]);
        setResource(res);
        setResourceUrl(res.url || "");
        setTitle(res.title);
        setDescription(res.description || "");
        const normFormat = res.format?.toLowerCase() || "";
        setFormat(normFormat);
        setMimeType(res.mime || "");
        setSelectedType(res.type || "");
        selectedTypeRef.current = res.type || "";
        selectedFormatRef.current = normFormat;
        if (res.checksum) {
          setChecksumType(res.checksum.type || "");
          setChecksumValue(res.checksum.value || "");
          selectedChecksumTypeRef.current = res.checksum.type || "";
          setShowChecksum(true);
        }
        setResourceTypes(types);
        setSchemas(availableSchemas);

        if (res.schema) {
          const name = res.schema.name || "";
          const url = res.schema.url || "";
          if (url && url.startsWith("http")) {
            setSchemaUrl(url);
          } else {
            const schemaVal = name || url;
            setLoadedSchema(schemaVal);
            selectedSchemaRef.current = schemaVal;
          }
        }
      } catch (error) {
        console.error("Error loading community resource:", error);
        setApiError("Erro ao carregar recurso comunitário.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [resourceId]);

  const clearError = (key: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearTypeError = React.useCallback(() => {
    setFormErrors((prev) => { const next = { ...prev }; delete next.type; return next; });
  }, []);

  const clearFormatError = React.useCallback(() => {
    setFormErrors((prev) => { const next = { ...prev }; delete next.format; return next; });
  }, []);

  const clearSchemaUrl = React.useCallback(() => {
    setSchemaUrl("");
  }, []);

  const handleSave = async () => {
    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!resourceUrl.trim()) errors.url = true;
    if (!selectedTypeRef.current) errors.type = true;
    if (!selectedFormatRef.current) errors.format = true;
    if (showChecksum && !checksumValue.trim()) errors.checksumValue = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFormErrors({});
    setApiError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const schemaUrlVal = schemaUrl.trim();
      const schemaNameVal = selectedSchemaRef.current;
      console.log("[debug] schemaUrl:", schemaUrlVal, "schemaRef:", schemaNameVal, "loadedSchema:", loadedSchema);
      const schemaPayload = schemaUrlVal
        ? { url: schemaUrlVal }
        : schemaNameVal
          ? { name: schemaNameVal }
          : null;

      const updated = await updateCommunityResource(resourceId, {
        title: title.trim(),
        description: description.trim() || undefined,
        url: resourceUrl.trim() || undefined,
        type: selectedTypeRef.current || undefined,
        format: selectedFormatRef.current.trim() || undefined,
        mime: mimeType.trim() || undefined,
        schema: schemaPayload,
        ...(showChecksum
          ? checksumValue
            ? { checksum: { type: selectedChecksumTypeRef.current || checksumType, value: checksumValue } }
            : {}
          : { checksum: null }),
      });
      setResource(updated);
      setSaveCount((c) => c + 1);
      setSelectedType(updated.type || "");
      const normFormat = updated.format?.toLowerCase() || "";
      setFormat(normFormat);
      setMimeType(updated.mime || "");
      if (updated.schema) {
        if (updated.schema.url && updated.schema.url.startsWith("http")) {
          setSchemaUrl(updated.schema.url);
          selectedSchemaRef.current = "";
        } else {
          selectedSchemaRef.current = updated.schema.name || updated.schema.url || "";
          setSchemaUrl("");
        }
      } else {
        selectedSchemaRef.current = "";
      }
      if (updated.checksum) {
        setChecksumType(updated.checksum.type || "");
        setChecksumValue(updated.checksum.value || "");
      }
      setSuccessMessage("Recurso comunitário atualizado com sucesso.");
      setTimeout(() => setSuccessMessage(null), 10000);
    } catch (err: unknown) {
      const error = err as { status?: number; data?: Record<string, unknown> };
      if (error?.status === 401) {
        setApiError("Sessao expirada. Faca login novamente.");
      } else {
        setApiError("Erro ao atualizar recurso comunitário.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
    () => (
      <DropdownSection name="types">
        {resourceTypes.map((t) => (
          <DropdownOption key={t.id} value={t.id} selected={t.id === selectedType}>
            {t.label}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [resourceTypes, selectedType],
  );

  const formatOptions = useMemo(
    () => {
      const standardFormats = ["csv", "json", "xml", "pdf", "xls", "xlsx", "ods", "doc", "docx", "zip", "gz", "tar", "shp", "geojson", "kml", "rdf", "ttl", "txt", "html"];
      const currentFormat = format.toLowerCase();
      const allFormats = (currentFormat && !standardFormats.includes(currentFormat))
        ? [...standardFormats, currentFormat]
        : standardFormats;

      return (
        <DropdownSection name="formats">
          {allFormats.map((f) => (
            <DropdownOption key={f} value={f} selected={f === currentFormat}>{f}</DropdownOption>
          ))}
        </DropdownSection>
      );
    },
    [format],
  );

  const schemaOptions = useMemo(() => {
    // Depend on loadedSchema (set only at initial load) instead of resource?.schema,
    // so setResource(updated) after save does not recompute children and re-render
    // the IsolatedSelect, which would trigger Agora's React 19 setState-in-render bug.
    const list =
      loadedSchema && !schemas.includes(loadedSchema)
        ? [loadedSchema, ...schemas]
        : schemas;

    const options = [
      <DropdownOption key="none" value="" selected={loadedSchema === ""}>
        Nenhum
      </DropdownOption>,
      ...list.map((s) => (
        <DropdownOption key={s} value={s} selected={s === loadedSchema}>
          {s}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="schemas">{options}</DropdownSection>;
  }, [schemas, loadedSchema]);

  const auxiliarItems = [
    {
      title: "Escolha o link correto",
      hasError: !!formErrors.url,
      content:
        "É recomendável criar um link para o próprio arquivo em vez de uma página da web para permitir que o site o analise.",
    },
    {
      title: "Soma de verificação",
      content:
        "O checksum permite ao utilizador verificar se os dados descarregados não foram corrompidos ou alterados.",
    },
    {
      title: "Dar um nome ao link",
      hasError: !!formErrors.title,
      content: (
        <>
          Recomenda-se a escolha de um título que informe claramente qualquer utilizador sobre o conteúdo
          do arquivo. Algumas práticas a evitar:
          <ul className="list-disc pl-16 mt-8">
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
      title: "Publicar os tipos de ficheiros corretos",
      hasError: !!formErrors.type,
      content: (
        <>
          Pode escolher entre os seguintes tipos:
          <ul className="list-disc pl-16 mt-8">
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
          <ul className="list-disc pl-16 mt-8">
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
          <ul className="list-disc pl-16 mt-8">
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
      title: "Selecionar um esquema",
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
        <StatusCard type="danger" description="Recurso comunitário nao encontrado." />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administracao", url: "/pages/admin" },
            { label: "Sistema", url: "#" },
            {
              label: "Recursos comunitários",
              url: "/pages/admin/system/community-resources",
            },
            { label: "Editar", url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Metadados do arquivo</h1>
      </div>

      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {successMessage && (
            <div className="mb-[16px]">
              <StatusCard type="success" description={successMessage} />
            </div>
          )}

          {apiError && (
            <div className="mb-[16px]">
              <StatusCard type="danger" description={apiError} />
            </div>
          )}

          <form className="admin-page__form">
            <p className="text-neutral-900 text-base leading-7">
              Os campos marcados com um asterisco ( * ) sao obrigatórios.
            </p>

            {/* PENHORA */}
            <h2 className="admin-page__section-title">Reutilização</h2>

            <div className="admin-page__fields-group">
              <InputText
                label="Link exato para o ficheiro *"
                placeholder="Insira o link para o ficheiro"
                id="resource-url"
                value={resourceUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setResourceUrl(e.target.value);
                  if (e.target.value.trim()) clearError("url");
                }}
                hasError={!!formErrors.url}
                hasFeedback={!!formErrors.url}
                feedbackState="danger"
                errorFeedbackText="Campo obrigatório"
              />
            </div>

            {/* SOMA DE VERIFICACAO */}
            <div className="flex flex-col items-start gap-[12px]">
              <h2 className="admin-page__section-title mb-0">Selo de verificação</h2>
              {showChecksum ? (
                <Button
                  variant="danger"
                  appearance="outline"
                  hasIcon
                  leadingIcon="agora-line-trash"
                  leadingIconHover="agora-solid-trash"
                  onClick={() => {
                    setShowChecksum(false);
                    setChecksumType("");
                    setChecksumValue("");
                  }}
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
                <IsolatedSelect
                  key={`checksum-${resource?.id || "loading"}-${saveCount}`}
                  label="Tipo de soma de verificação"
                  placeholder="SHA1"
                  id="checksum-type"
                  defaultValue={checksumType}
                  onChangeRef={selectedChecksumTypeRef}
                  onChangeCallback={(newType) => {
                    if (newType !== checksumType) {
                      setChecksumType(newType);
                      setChecksumValue("");
                    }
                  }}
                >
                  <DropdownSection name="checksum-types">
                    <DropdownOption value="sha1" selected={checksumType === "sha1"}>SHA1</DropdownOption>
                    <DropdownOption value="sha256" selected={checksumType === "sha256"}>SHA256</DropdownOption>
                    <DropdownOption value="md5" selected={checksumType === "md5"}>MD5</DropdownOption>
                    <DropdownOption value="crc" selected={checksumType === "crc"}>CRC</DropdownOption>
                  </DropdownSection>
                </IsolatedSelect>

                <InputText
                  label="Valor de checksum *"
                  placeholder="Introduza o valor do hash"
                  id="checksum-value"
                  value={checksumValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.nativeEvent.isTrusted) {
                      setChecksumValue(e.target.value);
                      if (e.target.value.trim()) setFormErrors((prev) => { const next = { ...prev }; delete next.checksumValue; return next; });
                    }
                  }}
                  hasError={!!formErrors.checksumValue}
                  hasFeedback={!!formErrors.checksumValue}
                  feedbackState="danger"
                  errorFeedbackText="Campo obrigatório"
                />
              </div>
            )}

            {/* DESCRICAO */}
            <h2 className="admin-page__section-title">Descrição</h2>

            <div className="admin-page__fields-group">
              <InputText
                label="Título *"
                placeholder="Insira o titulo aqui"
                id="resource-title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) clearError("title");
                }}
                hasError={!!formErrors.title}
                hasFeedback={!!formErrors.title}
                feedbackState="danger"
                errorFeedbackText="Campo obrigatório"
              />

              <div>
                <IsolatedSelect
                  key={`type-${resource?.id || "loading"}-${resourceTypes.length}`}
                  label="Tipo *"
                  placeholder="Ficheiros principais"
                  id="resource-type"
                  defaultValue={selectedType}
                  onChangeRef={selectedTypeRef}
                  onChangeCallback={clearTypeError}
                >
                  {typeOptions}
                </IsolatedSelect>
                {formErrors.type && (
                  <div className="feedback">
                    <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
                      <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
                    </span>
                    <p className="feedback-text feedback-text-light">Campo obrigatório</p>
                  </div>
                )}
              </div>

              <InputTextArea
                label="Descrição"
                placeholder="Insira a descrição aqui"
                id="resource-description"
                rows={10}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
              />

              <div>
                <IsolatedSelect
                  key={`format-${resource?.id || "loading"}`}
                  label="Formato *"
                  placeholder="Selecione o formato"
                  id="resource-format"
                  defaultValue={format}
                  onChangeRef={selectedFormatRef}
                  onChangeCallback={clearFormatError}
                >
                  {formatOptions}
                </IsolatedSelect>
                {formErrors.format && (
                  <div className="feedback">
                    <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
                      <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
                    </span>
                    <p className="feedback-text feedback-text-light">Campo obrigatório</p>
                  </div>
                )}
              </div>

              <InputText
                label="Tipo de recurso"
                placeholder="application/pdf"
                id="resource-mime"
                value={mimeType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMimeType(e.target.value)
                }
              />
            </div>

            {/* ESQUEMA DE DADOS */}
            <h2 className="admin-page__section-title">Esquema de dados</h2>

            <div className="admin-page__fields-group">
              <IsolatedSelect
                key={`schema-${resource?.id || "loading"}-${schemas.length}`}
                label="Plano"
                placeholder="Procure um esquema referenciado em dados.gov.pt..."
                id="resource-schema"
                searchable
                searchInputPlaceholder="Escreva para pesquisar..."
                defaultValue={loadedSchema}
                onChangeRef={selectedSchemaRef}
                onChangeCallback={clearSchemaUrl}
              >
                {schemaOptions}
              </IsolatedSelect>

              <div className="admin-page__divider-or">
                <span className="admin-page__divider-or-text">ou</span>
              </div>

              <InputText
                label="Adicione um link para o diagrama"
                placeholder="Insira o link para o diagrama"
                id="resource-schema-url"
                value={schemaUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSchemaUrl(e.target.value);
                  if (e.target.value) {
                    selectedSchemaRef.current = "";
                  }
                }}
              />
            </div>

            {/* Actions: Anterior + Guardar */}
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
                variant="primary"
                hasIcon
                trailingIcon="agora-line-check-circle"
                trailingIconHover="agora-solid-check-circle"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "A guardar..." : "Guardar"}
              </Button>
            </div>

            {/* Excluir o recurso */}
            <div className="dataset-edit-danger-actions">
              <StatusCard
                type="danger"
                description={
                  <>
                    <strong>Atenção Esta ação é irreversível.</strong>
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

        {/* Right: Auxiliar sidebar */}
        <aside className="admin-page__auxiliar">
          <div className="admin-page__auxiliar-inner">
            <div className="admin-page__auxiliar-header">
              <Icon name="agora-line-question-mark" className="w-[24px] h-[24px]" />
              <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
            </div>
            <AuxiliarList items={auxiliarItems} />
          </div>
        </aside>
      </div>
    </div>
  );
}
