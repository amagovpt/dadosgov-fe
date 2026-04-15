"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Breadcrumb,
  Button,
  Icon,
  InputText,
  InputTextArea,
  InputSelect,
  DropdownSection,
  DropdownOption,
  StatusCard,
  Pill,
  Switch,
  CardNoResults,
  CardLinks,
  ButtonUploader,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  fetchReuse,
  fetchDataset,
  updateReuse,
  deleteReuse,
  fetchReuseTypes,
  fetchReuseTopics,
  fetchMyDatasets,
  linkDatasetToReuse,
  linkDataserviceToReuse,
  fetchActivity,
  fetchDiscussions,
} from "@/services/api";
import { Reuse, ReuseType, ReuseTopic, Dataset, Activity, Discussion } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import AuxiliarList from "@/components/admin/AuxiliarList";

function TransferReusePopupContent({
  reuseTitle,
  onClose,
}: {
  reuseTitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p>
        <Icon name="agora-line-document" className="inline w-4 h-4 mr-[4px]" />
        <a href="#" className="text-primary-600 underline">
          {reuseTitle}
        </a>
      </p>
      <p>
        <strong>Esta ação é irreversível.</strong>&nbsp;
        Poderá deixar de conseguir gerir esta reutilização.
      </p>

      <div className="flex flex-col gap-[8px]">
        <label className="text-primary-900 text-base font-medium leading-7">
          Organização ou utilizador
        </label>
        <InputText
          placeholder="Selecione a identidade para a qual pretende transferir a reutilização..."
          id="transfer-reuse-search"
          label=""
        />
      </div>

      <div className="admin-page__org-card flex flex-col items-center gap-[16px] bg-neutral-50 rounded-lg p-8 text-center">
        <h3 className="text-primary-900 text-lg font-bold leading-7">
          Não pertence a uma organização.
        </h3>
        <p className="text-neutral-700 text-base leading-7">
          Quando a reutilização for produzida no contexto de atividade profissional, é
          recomendável que seja publicada em nome da organização responsável.
        </p>
        <Link
          href="/pages/admin/organizations"
          className="inline-flex items-center text-primary-500 text-base hover:underline"
        >
          <span className="mr-[5px]">Crie ou integre uma organização em dados.gov.pt</span>
          <Icon name="agora-line-arrow-right-circle" className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-[8px]">
        <label className="text-primary-900 text-base font-medium leading-7">
          Comentário
        </label>
        <InputTextArea
          placeholder=""
          id="transfer-reuse-comment"
          label=""
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-16 pt-16">
        <Button
          appearance="solid"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plane"
          leadingIconHover="agora-solid-plane"
          onClick={onClose}
        >
          Transferir a reutilização
        </Button>
      </div>
    </div>
  );
}

function DeleteReusePopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p>Esta ação é irreversível. Tem a certeza que quer eliminar esta reutilização?</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} hasIcon leadingIcon="agora-line-trash" leadingIconHover="agora-solid-trash">
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function ReusesEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const reuseId = (params?.reuseId as string) || searchParams.get("id") || searchParams.get("slug") || "";

  const [reuse, setReuse] = useState<Reuse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // API state
  const [featured, setFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Dropdown data
  const [reuseTypes, setReuseTypes] = useState<ReuseType[]>([]);
  const [reuseTopics, setReuseTopics] = useState<ReuseTopic[]>([]);

  // Discussions tab state
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false);

  // Activities tab state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const activityPageSize = 20;

  // Datasets tab state
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [associatedDatasets, setAssociatedDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasetLinks, setDatasetLinks] = useState([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
  const [apiLinks, setApiLinks] = useState([{ url: "" }]);
  const [apiLinkErrors, setApiLinkErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [r, types, topics, datasetsRes] = await Promise.all([
          fetchReuse(reuseId),
          fetchReuseTypes(),
          fetchReuseTopics(),
          fetchMyDatasets(1, 50),
        ]);
        setReuse(r);
        setTitle(r.title);
        setUrl(r.url);
        setDescription(r.description);
        setSelectedType(r.type || "");
        setSelectedTopic(r.topic || "");
        setFeatured(r.featured || false);
        setReuseTypes(types);
        setReuseTopics(topics);
        setMyDatasets(datasetsRes.data || []);
      } catch (error) {
        console.error("Error loading reuse:", error);
        setApiError("Erro ao carregar a reutilização.");
      } finally {
        setIsLoading(false);
      }
    }
    if (reuseId) loadData();
  }, [reuseId]);

  useEffect(() => {
    if (!reuse || !reuse.datasets || reuse.datasets.length === 0) return;
    async function loadAssociatedDatasets() {
      try {
        const slugs = reuse!.datasets.map((d) =>
          d.uri.split("/").filter(Boolean).pop() || d.id
        );
        const results = await Promise.all(
          slugs.map((s) => fetchDataset(s).catch(() => null))
        );
        setAssociatedDatasets(results.filter((d): d is Dataset => d !== null));
      } catch {
        setAssociatedDatasets([]);
      }
    }
    loadAssociatedDatasets();
  }, [reuse]);

  useEffect(() => {
    if (!reuseId) return;
    async function loadActivities() {
      setIsLoadingActivities(true);
      try {
        const response = await fetchActivity(reuseId!, activityPage, activityPageSize);
        setActivities(response.data || []);
        setActivityTotal(response.total || 0);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setIsLoadingActivities(false);
      }
    }
    loadActivities();
  }, [reuseId, activityPage]);

  const loadDiscussions = () => {
    if (discussionsLoaded || !reuseId) return;
    setDiscussionsLoading(true);
    fetchDiscussions(reuseId)
      .then((res) => {
        setDiscussions(res.data);
        setDiscussionsLoaded(true);
      })
      .catch((err) => console.error("Error loading discussions:", err))
      .finally(() => setDiscussionsLoading(false));
  };

  const totalActivityPages = Math.ceil(activityTotal / activityPageSize);

  const groupActivitiesByMonth = (acts: Activity[]) => {
    const groups: Record<string, Activity[]> = {};
    acts.forEach((act) => {
      const key = format(new Date(act.created_at), "MMMM 'de' yyyy", { locale: pt });
      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    });
    return groups;
  };

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveMetadata = async () => {
    if (!reuse) return;
    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!url.trim()) errors.url = true;
    if (!description.trim()) errors.description = true;
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
    setApiSuccess(null);
    setIsSubmitting(true);

    try {
      const updated = await updateReuse(reuse.id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        type: selectedType || undefined,
        topic: selectedTopic || undefined,
      });
      setReuse(updated);
      setApiSuccess("Reutilização atualizada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { status?: number; data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao atualizar a reutilização.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReuse = async () => {
    if (!reuse) return;
    hide();
    setIsSubmitting(true);
    try {
      await deleteReuse(reuse.id);
      router.push("/pages/admin/me/reuses");
    } catch (error) {
      console.error("Error deleting reuse:", error);
      setApiError("Erro ao eliminar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-600">A carregar...</p>
      </div>
    );
  }

  if (!reuse) {
    return (
      <div className="admin-page">
        <StatusCard type="danger" description="Reutilização não encontrada." />
        <Button
          variant="primary"
          onClick={() => router.push("/pages/admin/me/reuses")}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Reutilizações", url: "/pages/admin/me/reuses" },
            { label: reuse.title, url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">{reuse.title}</h1>
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => window.open(`/pages/reuses/${reuse.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="w-[16px] h-[16px]" />
            Ver página pública
          </span>
        </Button>
      </div>

      {apiError && <div className="mb-16"><StatusCard type="danger" description={apiError} /></div>}
      {apiSuccess && <div className="mb-16"><StatusCard type="success" description={apiSuccess} /></div>}

      <div className="admin-edit-info">
        <div className="admin-edit-info__badges">
          <Pill variant={reuse.private ? "warning" : "success"}>
            {reuse.private ? "RASCUNHO" : "PÚBLICO"}
          </Pill>
          {reuse.featured && <Pill variant="informative">DESTAQUE</Pill>}
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-eye" className="admin-edit-info__stat-icon" />
            {`${reuse.metrics?.views || 0} visualizações`}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
            {`${reuse.metrics?.followers || 0} favoritos`}
          </span>
        </div>

        <p className="admin-edit-info__activity">
          <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
          {" Atividade mais recente: "}
          {reuse.owner && (
            <>
              <Link
                href={`/pages/users/${reuse.owner.slug}`}
                className="text-primary-600 underline"
              >
                {reuse.owner.first_name} {reuse.owner.last_name}
              </Link>
            </>
          )}
          {" — editou a reutilização — "}
          <span>
            {format(new Date(reuse.last_modified), "d 'de' MMMM 'de' yyyy", {
              locale: pt,
            })}
          </span>
        </p>
      </div>

      <Tabs
        onTabActivation={(index: number) => {
          setApiError(null);
          setApiSuccess(null);
          if (index === 3) loadDiscussions();
        }}
      >
        {/* Metadata Tab */}
        <Tab>
          <TabHeader>Metadados</TabHeader>
          <TabBody>
            <div className="admin-page__body">
              <div className="admin-page__form-area">
                <div className="dataset-edit-visibility-banner">
                  <StatusCard
                    type="info"
                    description={
                      <>
                        Modificar a visibilidade da reutilização
                        <br />
                        <span className="text-neutral-900 uppercase">
                          {reuse.private ? "rascunho" : "público"}
                        </span>
                      </>
                    }
                  />
                  <div>
                    {/* <Button
                      variant="primary"
                      appearance="outline"
                      onClick={async () => {
                        try {
                          const updated = await updateReuse(reuse.id, {
                            private: !reuse.private,
                          });
                          setReuse(updated);
                          setApiSuccess(
                            updated.private
                              ? "Reutilização guardada como rascunho."
                              : "Reutilização publicada com sucesso."
                          );
                          setTimeout(() => setApiSuccess(null), 10000);
                        } catch {
                          setApiError("Erro ao alterar a visibilidade.");
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      {reuse.private ? "Publicar reutilização" : "Salvar como rascunho"}
                    </Button> */}
                  </div>
                </div>

                <form
                  className="admin-page__form"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <p className="text-neutral-900 text-base leading-7">
                    Os campos marcados com um asterisco ( * ) são obrigatórios.
                  </p>

                  <h2 className="admin-page__section-title">Destaque</h2>
                  <div className="admin-page__fields-group">
                    <Switch
                      label="Destaque"
                      checked={featured}
                      onChange={() => setFeatured((v) => !v)}
                    />
                  </div>

                  <h2 className="admin-page__section-title">Descrição</h2>
                  <div className="admin-page__fields-group">
                    <InputText
                      label="Nome da reutilização *"
                      placeholder="Insira o nome aqui"
                      id="edit-title"
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
                    <InputText
                      label="URL *"
                      placeholder="Insira o URL aqui (ex: https://...)"
                      id="edit-url"
                      value={url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setUrl(e.target.value);
                        if (e.target.value.trim()) clearError("url");
                      }}
                      hasError={!!formErrors.url}
                      hasFeedback={!!formErrors.url}
                      feedbackState="danger"
                      errorFeedbackText="Campo obrigatório"
                    />
                    <InputSelect
                      label="Tipo *"
                      placeholder="Selecione um tipo..."
                      id="edit-type"
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar..."
                      searchNoResultsText="Nenhum resultado encontrado"
                      defaultValue={selectedType}
                      onChange={(options) => {
                        if (options.length > 0) setSelectedType(options[0].value as string);
                      }}
                    >
                      <DropdownSection name="types">
                        {reuseTypes.map((t) => (
                          <DropdownOption key={t.id} value={t.id}>
                            {t.label}
                          </DropdownOption>
                        ))}
                      </DropdownSection>
                    </InputSelect>
                    <InputTextArea
                      label="Descrição *"
                      placeholder="Insira a descrição aqui"
                      id="edit-description"
                      rows={6}
                      maxLength={246}
                      showCharCounter={true}
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setDescription(e.target.value);
                        if (e.target.value.trim()) clearError("description");
                      }}
                      hasError={formErrors.description ? true : undefined}
                      hasFeedback={formErrors.description ? true : undefined}
                      feedbackState="danger"
                      feedbackText="Campo obrigatório"
                      errorFeedbackText="Campo obrigatório"
                    />
                    <InputSelect
                      label="Palavras-chave"
                      placeholder="Pesquise ou insira palavras-chave..."
                      id="edit-keywords"
                      type="checkbox"
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar..."
                      searchNoResultsText="Nenhum resultado encontrado"
                    >
                      <DropdownSection name="keywords">
                        {(reuse.tags || []).map((tag) => (
                          <DropdownOption key={tag} value={tag}>
                            {tag}
                          </DropdownOption>
                        ))}
                      </DropdownSection>
                    </InputSelect>
                    <div>
                      <span className="text-primary-900 text-base font-medium leading-7">
                        Imagem de capa *
                      </span>
                      <div className="mt-2">
                        <ButtonUploader
                          label="Ficheiros"
                          inputLabel="Selecione ou arraste o ficheiro"
                          removeFileButtonLabel="Remover ficheiro"
                          replaceFileButtonLabel="Substituir ficheiro"
                          extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
                          accept=".jpg,.jpeg,.png"
                          maxSize={4194304}
                          maxCount={1}
                          onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                            const files = e.target.files;
                            if (!files || files.length === 0 || !reuse) return;
                            setIsSubmitting(true);
                            try {
                              const { uploadReuseImage } = await import("@/services/api");
                              const updated = await uploadReuseImage(reuse.id, files[0]);
                              setReuse(updated);
                              setApiSuccess("Imagem de capa atualizada com sucesso.");
                              setTimeout(() => setApiSuccess(null), 10000);
                            } catch {
                              setApiError("Erro ao carregar imagem de capa.");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-page__actions flex justify-end mt-[24px]">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={handleSaveMetadata}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>

                  <div className="dataset-edit-danger-actions">
                    <StatusCard
                      type="info"
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
                            onClick={() => {
                              show(
                                <TransferReusePopupContent
                                  reuseTitle={reuse.title}
                                  onClose={hide}
                                />,
                                {
                                  title: "Transfira a reutilização",
                                  closeAriaLabel: "Fechar",
                                  dimensions: "m",
                                },
                              );
                            }}
                          >
                            Transferir a reutilização
                          </Button>
                        </>
                      }
                    />
                    <StatusCard
                      type="warning"
                      description={
                        <>
                          <strong>
                            Uma reutilização arquivada deixa de estar indexada no portal, mas
                            permanece acessível através de um link direto.
                          </strong>
                          <br />
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                          >
                            Arquivar a reutilização
                          </Button>
                        </>
                      }
                    />
                    <StatusCard
                      type="danger"
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
                            onClick={() => {
                              show(
                                <DeleteReusePopupContent
                                  onClose={hide}
                                  onConfirm={handleDeleteReuse}
                                />,
                                {
                                  title: "Elimine a reutilização",
                                  closeAriaLabel: "Fechar",
                                  dimensions: "m",
                                },
                              );
                            }}
                            disabled={isSubmitting}
                          >
                            Eliminar a reutilização
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
                    <Icon
                      name="agora-line-question-mark"
                      className="w-[24px] h-[24px]"
                    />
                    <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
                  </div>
                  <AuxiliarList
                    items={[
                      {
                        title: "Dê um nome à sua reutilização.",
                        content:
                          'Prefira um título que permita entender como os dados são usados, em vez do nome do site ou aplicativo ("Mecanismo de Busca de Acordos Comerciais" em vez de "Acordos-Comerciais.fr", por exemplo).',
                        hasError: !!formErrors.title,
                      },
                      {
                        title: "Qual link preencher?",
                        content:
                          "Insira o link para a página onde a reutilização é visível. Aponte para a reutilização em si, e não para uma página inicial. Certifique-se de que a ligação esteja estável ao longo do tempo.",
                        hasError: !!formErrors.url,
                      },
                      {
                        title: "Escolha um tipo",
                        content:
                          "Indique o tipo em que deve ser classificada a reutilização (API, aplicação, artigo de imprensa, visualização, etc.).",
                      },
                      {
                        title: "Descreva sua reutilização",
                        content:
                          "Você pode preencher o método de criação da reutilização, o que a reutilização permite que você faça, mostre ou diga mais sobre si mesmo e o contexto dessa reutilização. É melhor manter um tom neutro: se a reutilização parecer muito uma mensagem promocional, podemos removê-la.",
                        hasError: !!formErrors.description,
                      },
                      {
                        title: "Adicionar palavras-chave",
                        content: (
                          <>
                            <p>
                              As palavras-chave aparecem na página de destino e melhoram o
                              posicionamento nos mecanismos de pesquisa. Para cada palavra-chave,
                              pode obter uma lista de reutilizações para as quais essa
                              palavra-chave também foi atribuída.
                            </p>
                            <p className="font-bold mt-3">Sugestões automáticas</p>
                            <p className="mt-2">
                              Com base no conteúdo que reutiliza, podem ser sugeridas
                              palavras-chave automaticamente. Pode aceitá-las, modificá-las ou
                              excluí-las.
                            </p>
                          </>
                        ),
                      },
                      {
                        title: "Escolha uma imagem",
                        content:
                          'Se a sua reutilização assumir a forma de uma representação gráfica, pode fornecer uma pré-visualização usando uma imagem ou captura de ecrã. Esta imagem aparecerá na secção "Reutilizações" da página do conjunto de dados associado.',
                      },
                    ]}
                  />
                </div>
              </aside>
            </div>
          </TabBody>
        </Tab>

        {/* Datasets Tab */}
        <Tab>
          <TabHeader>Conjuntos de dados ({reuse.datasets?.length || 0})</TabHeader>
          <TabBody>
            <div className="admin-page__body mt-[24px]">
              <div className="admin-page__form-area">
                {associatedDatasets.length > 0 && (
                  <div className="agora-card-links-datasets-px0 mb-[24px]">
                    {associatedDatasets.map((dataset) => (
                      <CardLinks
                        key={dataset.id}
                        onClick={() => { }}
                        className="cursor-pointer text-neutral-900"
                        variant="transparent"
                        image={{
                          src: dataset.organization?.logo || "/images/placeholders/organization.png",
                          alt: dataset.organization?.name || "Organização sem logo",
                        }}
                        category={dataset.organization?.name}
                        title={dataset.title}
                        description={
                          <div className="flex flex-col gap-12">
                            <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
                              {dataset.description}
                            </p>
                            <div className="flex flex-wrap gap-8 items-center mt-[8px]">
                              <span className="text-sm font-medium text-neutral-900">
                                Metadados: {dataset.quality?.score != null ? Math.round(dataset.quality.score * 100) : 0}%
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-[32px] text-xs mt-[32px] text-[#034AD8] mb-[32px]">
                              <div className="flex items-center gap-8" title="Visualizações">
                                <Icon name="agora-line-eye" className="" aria-hidden="true" />
                                <span>
                                  {dataset.metrics?.views
                                    ? dataset.metrics.views >= 1000
                                      ? (dataset.metrics.views / 1000).toFixed(0) + " mil"
                                      : dataset.metrics.views
                                    : "0"}
                                </span>
                              </div>
                              <div className="flex items-center gap-8" title="Downloads">
                                <Icon name="agora-line-download" className="" aria-hidden="true" />
                                <span>
                                  {dataset.metrics?.resources_downloads
                                    ? dataset.metrics.resources_downloads >= 1000
                                      ? (dataset.metrics.resources_downloads / 1000).toFixed(0) + " mil"
                                      : dataset.metrics.resources_downloads
                                    : "0"}
                                </span>
                              </div>
                              <div className="flex items-center gap-8" title="Reutilizações">
                                <img src="/Icons/bar_chart_primary.svg" className="" alt="" aria-hidden="true" />
                                <span>{dataset.metrics?.reuses || 0}</span>
                              </div>
                              <div className="flex items-center gap-8" title="Favoritos">
                                <img src="/Icons/favorite.svg" className="" alt="" aria-hidden="true" />
                                <span>{dataset.metrics?.followers || 0}</span>
                              </div>
                            </div>
                          </div>
                        }
                        date={
                          <span className="font-[300]">
                            {`Atualizado há ${formatDistanceToNow(new Date(dataset.last_modified), { locale: pt }).replace("aproximadamente ", "").replace("quase ", "").replace("menos de ", "").replace("cerca de ", "")}`}
                          </span>
                        }
                        mainLink={
                          <Link href={`/pages/datasets/${dataset.slug}`}>
                            <span className="underline">{dataset.title}</span>
                          </Link>
                        }
                        blockedLink={true}
                      />
                    ))}
                  </div>
                )}

                <form className="admin-page__form">
                  {selectedDataset && (
                    <div className="agora-card-links-datasets-px0 mt-[16px]">
                      <CardLinks
                        onClick={() => { }}
                        className="cursor-pointer text-neutral-900"
                        variant="transparent"
                        image={{
                          src: selectedDataset.organization?.logo || "/images/placeholders/organization.png",
                          alt: selectedDataset.organization?.name || "Organização sem logo",
                        }}
                        category={selectedDataset.organization?.name}
                        title={selectedDataset.title}
                        description={
                          <div className="flex flex-col gap-12">
                            <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
                              {selectedDataset.description}
                            </p>
                            <div className="flex flex-wrap gap-8 items-center mt-[8px]">
                              <span className="text-sm font-medium text-neutral-900">
                                Metadados: {selectedDataset.quality?.score != null ? Math.round(selectedDataset.quality.score * 100) : 0}%
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-[32px] text-xs mt-[32px] text-[#034AD8] mb-[32px]">
                              <div className="flex items-center gap-8" title="Visualizações">
                                <Icon name="agora-line-eye" className="" aria-hidden="true" />
                                <span>{selectedDataset.metrics?.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-8" title="Downloads">
                                <Icon name="agora-line-download" className="" aria-hidden="true" />
                                <span>{selectedDataset.metrics?.resources_downloads || 0}</span>
                              </div>
                              <div className="flex items-center gap-8" title="Reutilizações">
                                <img src="/Icons/bar_chart_primary.svg" className="" alt="" aria-hidden="true" />
                                <span>{selectedDataset.metrics?.reuses || 0}</span>
                              </div>
                              <div className="flex items-center gap-8" title="Favoritos">
                                <img src="/Icons/favorite.svg" className="" alt="" aria-hidden="true" />
                                <span>{selectedDataset.metrics?.followers || 0}</span>
                              </div>
                            </div>
                          </div>
                        }
                        date={
                          <span className="font-[300]">
                            {`Atualizado há ${formatDistanceToNow(new Date(selectedDataset.last_modified), { locale: pt }).replace("aproximadamente ", "").replace("quase ", "").replace("menos de ", "").replace("cerca de ", "")}`}
                          </span>
                        }
                        mainLink={
                          <Link href={`/pages/datasets/${selectedDataset.slug}`}>
                            <span className="underline">{selectedDataset.title}</span>
                          </Link>
                        }
                        blockedLink={true}
                      />
                    </div>
                  )}

                  <InputSelect
                    label="Pesquisar um conjunto de dados"
                    placeholder="Procurando um conjunto de dados..."
                    id="edit-dataset-search"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onChange={(options) => {
                      if (options.length > 0) {
                        const found = myDatasets.find((d) => d.id === options[0].value);
                        setSelectedDataset(found || null);
                      } else {
                        setSelectedDataset(null);
                      }
                    }}
                  >
                    <DropdownSection name="datasets">
                      {myDatasets.map((d) => (
                        <DropdownOption key={d.id} value={d.id}>
                          {d.title}
                        </DropdownOption>
                      ))}
                    </DropdownSection>
                  </InputSelect>

                  <div className="admin-page__divider-or">
                    <span className="admin-page__divider-or-text">ou</span>
                  </div>

                  {datasetLinks.map((link, index) => (
                    <div key={`dataset-${index}`}>
                      <InputText
                        label="Link para o conjunto de dados"
                        placeholder="Insira o URL aqui"
                        id={`edit-dataset-url-${index}`}
                        value={link.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newLinks = [...datasetLinks];
                          newLinks[index] = { url: e.target.value };
                          setDatasetLinks(newLinks);
                          if (e.target.value.trim()) {
                            setDatasetLinkErrors((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }
                        }}
                        hasError={!!datasetLinkErrors[index]}
                        hasFeedback={!!datasetLinkErrors[index]}
                        feedbackState="danger"
                        errorFeedbackText={datasetLinkErrors[index]}
                      />
                      {link.url.trim() && (
                        <div className="flex justify-end mt-[24px]">
                          <Button
                            appearance="solid"
                            variant="danger"
                            hasIcon
                            leadingIcon="agora-line-trash"
                            leadingIconHover="agora-solid-trash"
                            onClick={() => {
                              const newLinks = datasetLinks.filter((_, i) => i !== index);
                              setDatasetLinks(newLinks.length > 0 ? newLinks : [{ url: "" }]);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      appearance="outline"
                      variant="primary"
                      hasIcon
                      leadingIcon="agora-line-plus-circle"
                      leadingIconHover="agora-solid-plus-circle"
                      onClick={() => {
                        const lastIndex = datasetLinks.length - 1;
                        if (!datasetLinks[lastIndex].url.trim()) {
                          setDatasetLinkErrors((prev) => ({
                            ...prev,
                            [lastIndex]: "Campo obrigatório",
                          }));
                          return;
                        }
                        setDatasetLinks([...datasetLinks, { url: "" }]);
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>

                  <div className="admin-page__actions flex justify-end gap-[18px]">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={async () => {
                        if (!reuse) return;
                        const errors: Record<number, string> = {};
                        datasetLinks.forEach((link, index) => {
                          if (!link.url.trim() && datasetLinks.length > 1) {
                            errors[index] = "Campo obrigatório";
                          }
                        });
                        if (Object.keys(errors).length > 0) {
                          setDatasetLinkErrors(errors);
                          return;
                        }
                        setDatasetLinkErrors({});
                        setIsSubmitting(true);
                        setApiError(null);
                        try {
                          for (const link of datasetLinks) {
                            if (link.url.trim()) {
                              await linkDatasetToReuse(reuse.id, link.url.trim());
                            }
                          }
                          const updated = await fetchReuse(reuseId);
                          setReuse(updated);
                          setDatasetLinks([{ url: "" }]);
                          setSelectedDataset(null);
                          setApiSuccess("Conjuntos de dados associados com sucesso.");
                          setTimeout(() => setApiSuccess(null), 10000);
                        } catch {
                          setApiError("Erro ao associar conjuntos de dados.");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || (!selectedDataset && !datasetLinks.some((l) => l.url.trim()))}
                    >
                      {isSubmitting ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabBody>
        </Tab>

        {/* API Tab */}
        <Tab>
          <TabHeader>API ({reuse.dataservices?.length || 0})</TabHeader>
          <TabBody>
            <div className="admin-page__body mt-[24px]">
              <div className="admin-page__form-area">
                {reuse.dataservices && reuse.dataservices.length > 0 && (
                  <div className="space-y-16 mb-[24px]">
                    {reuse.dataservices.map((api) => (
                      <div key={api.id} className="border border-neutral-200 rounded-4 p-16 flex items-center justify-between">
                        <div className="flex items-center gap-12">
                          <Icon name="agora-line-code" className="w-[24px] h-[24px]" />
                          <span className="text-neutral-900 font-medium">{api.title}</span>
                        </div>
                        <button
                          type="button"
                          className="border border-neutral-300 rounded-4 p-8 hover:bg-neutral-100"
                          title="Eliminar API"
                        >
                          <Icon name="agora-line-trash" className="w-[20px] h-[20px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form className="admin-page__form">
                  <InputSelect
                    label="Pesquisar uma API"
                    placeholder="Pesquise uma API..."
                    id="edit-api-search"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                  >
                    <DropdownSection name="apis">
                      <DropdownOption value="">—</DropdownOption>
                    </DropdownSection>
                  </InputSelect>

                  <div className="admin-page__divider-or">
                    <span className="admin-page__divider-or-text">ou</span>
                  </div>

                  {apiLinks.map((link, index) => (
                    <div key={`api-${index}`}>
                      <InputText
                        label="Link para a API"
                        placeholder="https://..."
                        id={`edit-api-url-${index}`}
                        value={link.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newLinks = [...apiLinks];
                          newLinks[index] = { url: e.target.value };
                          setApiLinks(newLinks);
                          if (e.target.value.trim()) {
                            setApiLinkErrors((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }
                        }}
                        hasError={!!apiLinkErrors[index]}
                        hasFeedback={!!apiLinkErrors[index]}
                        feedbackState="danger"
                        errorFeedbackText={apiLinkErrors[index]}
                      />
                      {link.url.trim() && (
                        <div className="flex justify-end mt-[24px]">
                          <Button
                            appearance="solid"
                            variant="danger"
                            hasIcon
                            leadingIcon="agora-line-trash"
                            leadingIconHover="agora-solid-trash"
                            onClick={() => {
                              const newLinks = apiLinks.filter((_, i) => i !== index);
                              setApiLinks(newLinks.length > 0 ? newLinks : [{ url: "" }]);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      appearance="outline"
                      variant="primary"
                      hasIcon
                      leadingIcon="agora-line-plus-circle"
                      leadingIconHover="agora-solid-plus-circle"
                      onClick={() => {
                        const lastIndex = apiLinks.length - 1;
                        if (!apiLinks[lastIndex].url.trim()) {
                          setApiLinkErrors((prev) => ({
                            ...prev,
                            [lastIndex]: "Campo obrigatório",
                          }));
                          return;
                        }
                        setApiLinks([...apiLinks, { url: "" }]);
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>

                  <div className="admin-page__actions flex justify-end gap-[18px]">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={async () => {
                        if (!reuse) return;
                        const errors: Record<number, string> = {};
                        apiLinks.forEach((link, index) => {
                          if (!link.url.trim() && apiLinks.length > 1) {
                            errors[index] = "Campo obrigatório";
                          }
                        });
                        if (Object.keys(errors).length > 0) {
                          setApiLinkErrors(errors);
                          return;
                        }
                        setApiLinkErrors({});
                        setIsSubmitting(true);
                        setApiError(null);
                        try {
                          for (const link of apiLinks) {
                            if (link.url.trim()) {
                              await linkDataserviceToReuse(reuse.id, link.url.trim());
                            }
                          }
                          const updated = await fetchReuse(reuseId);
                          setReuse(updated);
                          setApiLinks([{ url: "" }]);
                          setApiSuccess("APIs associadas com sucesso.");
                          setTimeout(() => setApiSuccess(null), 10000);
                        } catch {
                          setApiError("Erro ao associar APIs.");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || !apiLinks.some((l) => l.url.trim())}
                    >
                      {isSubmitting ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabBody>
        </Tab>

        {/* Discussions Tab */}
        <Tab>
          <TabHeader>Discussões ({discussions.length})</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              {discussionsLoading && (
                <p className="text-neutral-700 text-sm">A carregar...</p>
              )}
              {discussionsLoaded && discussions.length === 0 && (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-chat" className="w-12 h-12 text-primary-500 icon-xl" />
                  }
                  title="Sem discussões"
                  description="Ainda não existem discussões nesta reutilização."
                  hasAnchor={false}
                />
              )}
              {discussionsLoaded && discussions.length > 0 && (
                <div>
                  <h2 className="font-medium text-neutral-900 text-base mb-[16px]">
                    {discussions.length} {discussions.length === 1 ? "DISCUSSÃO" : "DISCUSSÕES"}
                  </h2>
                  <div className="space-y-[16px]">
                    {discussions.map((disc) => (
                      <div key={disc.id} className="bg-white rounded-[8px] p-[32px]">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 text-base">{disc.title}</h4>
                            <p className="text-sm text-neutral-900 mt-[4px]">
                              <span className="text-primary-600 font-medium">
                                {disc.user.first_name} {disc.user.last_name}
                              </span>
                              {" — Publicado em "}
                              {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                            </p>
                          </div>
                          <Pill
                            variant={disc.closed ? "neutral" : "informative"}
                          >
                            {disc.closed ? "Fechada" : "Aberta"}
                          </Pill>
                        </div>
                        {disc.discussion.length > 0 && (
                          <p className="text-neutral-900 text-sm mt-[16px]">
                            {disc.discussion[0].content}
                          </p>
                        )}
                        {disc.discussion.length > 1 && (
                          <div className="mt-[16px] space-y-[16px] border-t border-neutral-200 pt-[16px]">
                            {disc.discussion.slice(1).map((msg, idx) => (
                              <div key={idx} className="border-l-2 border-primary-600 pl-[24px]">
                                <p className="text-sm text-neutral-900">
                                  <span className="text-primary-600 font-medium">
                                    {msg.posted_by.first_name} {msg.posted_by.last_name}
                                  </span>
                                  {" — "}
                                  {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                </p>
                                <p className="text-neutral-900 text-sm mt-[4px]">
                                  {msg.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabBody>
        </Tab>

        {/* Activities Tab */}
        <Tab>
          <TabHeader>Atividades</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              {isLoadingActivities ? (
                <p className="text-neutral-900 text-base">A carregar atividades...</p>
              ) : activities.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
                  }
                  title="Sem atividades"
                  description="Nenhuma atividade registada nesta reutilização."
                  hasAnchor={false}
                />
              ) : (
                <div className="space-y-32">
                  {Object.entries(groupActivitiesByMonth(activities)).map(([month, acts]) => (
                    <div key={month}>
                      <h3 className="text-neutral-900 text-sm font-medium mb-16">{month}</h3>
                      <div className="relative border-l-2 border-neutral-200 ml-4">
                        {acts.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-16 pb-16 ml-16 relative">
                            <div className="absolute -left-[25px] top-1 w-8 h-8 rounded-full bg-neutral-300" />
                            <div className="flex-1 flex items-start justify-between">
                              <div>
                                <span className="text-sm">
                                  <Icon
                                    name="agora-line-user"
                                    className="w-4 h-4 inline text-primary-600 mr-4"
                                  />
                                  <span className="text-primary-600 font-medium">
                                    {act.actor.first_name} {act.actor.last_name}
                                  </span>
                                  {" ► "}
                                  <span className="text-neutral-900">{act.label}</span>
                                </span>
                                {act.related_to_url && (
                                  <div>
                                    <a
                                      href={act.related_to_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 text-sm underline"
                                    >
                                      {act.related_to}
                                      <Icon
                                        name="agora-line-external-link"
                                        className="w-3 h-3 inline ml-4"
                                      />
                                    </a>
                                  </div>
                                )}
                              </div>
                              <span className="text-neutral-900 text-sm whitespace-nowrap ml-16">
                                {format(new Date(act.created_at), "d 'de' MMMM 'de' yyyy", {
                                  locale: pt,
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {totalActivityPages > 1 && (
                    <div className="flex items-center justify-center gap-8 mt-32">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-neutral-900 text-sm">
                        Página {activityPage} de {totalActivityPages}
                      </span>
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                        disabled={activityPage === totalActivityPages}
                      >
                        Seguinte
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
