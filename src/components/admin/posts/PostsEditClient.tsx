"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  Button,
  DropdownSection,
  DropdownOption,
  InputText,
  InputTextArea,
  InputSelect,
  DragAndDropUploader,
  RadioButton,
  Icon,
  StatusCard,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { fetchPost, updatePost, uploadPostImage, suggestTags, deletePost, unpublishPost, publishPost } from "@/services/api";
import type { Post, PostUpdatePayload, TagSuggestion } from "@/types/api";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => <p>A carregar editor...</p>,
});

function DeletePostPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p>Essa ação não pode ser desfeita.</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function PostsEditClient() {
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [articleType, setArticleType] = useState("news");
  const [contentType, setContentType] = useState("markdown");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleHeader, setArticleHeader] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<TagSuggestion[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [postData, tagsData] = await Promise.all([fetchPost(postId), suggestTags("", 50)]);

        if (postData) {
          setPost(postData);
          setArticleTitle(postData.name || "");
          setArticleHeader(postData.headline || "");
          setArticleContent(postData.content || "");
          setContentType(postData.body_type || "markdown");
          setArticleType(postData.kind || "news");
          setSelectedTags(postData.tags || []);
        }

        setTags(tagsData);
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [postId]);

  const handleSaveMetadata = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!articleTitle.trim()) return;

    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const payload: PostUpdatePayload = {
        name: articleTitle.trim(),
        headline: articleHeader.trim(),
        body_type: contentType,
        kind: articleType,
        tags: selectedTags,
      };

      const result = await updatePost(postId, payload);
      if (result) {
        setPost(result);
        setApiSuccess("Metadados guardados com sucesso.");
        setTimeout(() => setApiSuccess(null), 10000);
      } else {
        setApiError("Erro ao guardar. Verifique a autenticação.");
      }
    } catch {
      setApiError("Erro ao guardar os metadados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContent = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!articleContent.trim()) return;

    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const payload: PostUpdatePayload = {
        content: articleContent.trim(),
      };

      const result = await updatePost(postId, payload);
      if (result) {
        setPost(result);
        setApiSuccess("Conteúdo guardado com sucesso.");
        setTimeout(() => setApiSuccess(null), 10000);
      } else {
        setApiError("Erro ao guardar. Verifique a autenticação.");
      }
    } catch {
      setApiError("Erro ao guardar o conteúdo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublish = async () => {
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const result = await unpublishPost(postId);
      if (result) {
        setPost(result);
        setApiSuccess("Artigo despublicado com sucesso.");
        setTimeout(() => setApiSuccess(null), 10000);
      } else {
        setApiError("Erro ao retirar. Verifique a autenticação.");
      }
    } catch {
      setApiError("Erro ao retirar o artigo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRepublish = async () => {
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const result = await publishPost(postId);
      if (result) {
        setPost(result);
        setApiSuccess("Artigo publicado com sucesso.");
        setTimeout(() => setApiSuccess(null), 10000);
      } else {
        setApiError("Erro ao publicar. Verifique a autenticação.");
      }
    } catch {
      setApiError("Erro ao publicar o artigo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const success = await deletePost(postId);
      if (success) {
        router.push("/pages/admin/system/posts");
      } else {
        setApiError("Erro ao eliminar. Verifique a autenticação.");
      }
    } catch {
      setApiError("Erro ao eliminar o artigo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const file = files[0];
    if (file.size > 4194304) {
      setImageError("O ficheiro excede o tamanho máximo de 4 MB.");
      return;
    }
    setImageError(null);
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const result = await uploadPostImage(postId, file);
      if (result) {
        setPost(result);
        setApiSuccess("Imagem carregada com sucesso.");
        setTimeout(() => setApiSuccess(null), 10000);
      } else {
        setApiError("Erro ao carregar a imagem.");
      }
    } catch {
      setApiError("Erro ao carregar a imagem.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <p>A carregar...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="admin-page">
        <p>Artigo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Bem-vindo", url: "/pages/admin" },
            { label: "Artigos", url: "/pages/admin/system/posts" },
            { label: post.name, url: "#" },
          ]}
        />
      </div>

      <div
        className="admin-page__header"
        style={{ flexDirection: "column", alignItems: "flex-start" }}
      >
        <div className="flex justify-end w-full">
          <Button
            variant="primary"
            appearance="outline"
            onClick={() => window.open(`/pages/posts/${post.slug}`, "_blank")}
          >
            <span className="admin-edit-info__btn-content">
              <Icon name="agora-line-eye" className="w-[16px] h-[16px]" />
              Veja a página do artigo
            </span>
          </Button>
        </div>
        <h1 className="admin-page__title">{post.name}</h1>
      </div>

      {apiError && <StatusCard type="danger" description={apiError} />}
      {apiSuccess && <StatusCard type="success" description={apiSuccess} />}

      <Tabs
        className="mt-8"
        onTabActivation={() => {
          setApiError(null);
          setApiSuccess(null);
        }}
      >
        {/* Metadados Tab */}
        <Tab>
          <TabHeader>Metadados</TabHeader>
          <TabBody>
            <div className="admin-page__body">
              <div className="admin-page__form-area">
                <form className="admin-page__form mt-[24px]">
                  <p className="text-neutral-900 text-base leading-7">
                    Campos precedidos por uma estrela (*) são obrigatórios.
                  </p>

                  <h2 className="admin-page__section-title mt-8">DESCRIÇÃO</h2>

                  <div className="admin-page__fields-group">
                    <InputText
                      label="Título do artigo *"
                      placeholder="Insira o título aqui"
                      id="article-title"
                      value={articleTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setArticleTitle(e.target.value)
                      }
                    />

                    <InputTextArea
                      label="Cabeçalho *"
                      placeholder="Insira aqui"
                      id="article-header"
                      rows={3}
                      value={articleHeader}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setArticleHeader(e.target.value)
                      }
                    />

                    <div className="flex flex-col gap-[8px]">
                      <span className="text-primary-900 text-base font-medium leading-7">
                        Tipo de Item
                      </span>
                      <div className="flex flex-row gap-4">
                        <RadioButton
                          label="Notícias"
                          id="article-type-news"
                          name="article-type"
                          checked={articleType === "news"}
                          onChange={() => setArticleType("news")}
                        />
                        <RadioButton
                          label="Page"
                          id="article-type-page"
                          name="article-type"
                          checked={articleType === "page"}
                          onChange={() => setArticleType("page")}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-[8px]">
                      <span className="text-primary-900 text-base font-medium leading-7">
                        Tipo de conteúdo
                      </span>
                      <div className="flex flex-row gap-4">
                        <RadioButton
                          label="HTML"
                          id="content-html"
                          name="content-type"
                          checked={contentType === "html"}
                          onChange={() => setContentType("html")}
                        />
                        <RadioButton
                          label="Markdown"
                          id="content-markdown"
                          name="content-type"
                          checked={contentType === "markdown"}
                          onChange={() => setContentType("markdown")}
                        />
                        <RadioButton
                          label="Blocos"
                          id="content-blocks"
                          name="content-type"
                          checked={contentType === "blocks"}
                          onChange={() => setContentType("blocks")}
                        />
                      </div>
                    </div>

                    <InputSelect
                      label="Tags"
                      placeholder="Procure uma palavra-chave..."
                      id="article-keywords"
                      type="checkbox"
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar..."
                      searchNoResultsText="Nenhum resultado encontrado"
                      pluralSelectedPlaceholder="selecionadas"
                      hideSectionNames={true}
                      multiple={true}
                      onChange={(options) => {
                        setSelectedTags(options.map((o) => o.value as string));
                      }}
                    >
                      <DropdownSection name="keywords">
                        {tags.map((tag) => (
                          <DropdownOption
                            key={tag.text}
                            value={tag.text}
                            selected={selectedTags.some((s) => s === tag.text)}
                          >
                            {tag.text}
                          </DropdownOption>
                        ))}
                      </DropdownSection>
                    </InputSelect>

                    <div>
                      <span className="text-primary-900 text-base font-medium leading-7">
                        Cobertura *
                      </span>
                      <div className="mt-2">
                        <DragAndDropUploader
                          label="Ficheiros"
                          dragAndDropLabel="Arraste e largue o ficheiro aqui"
                          inputLabel="Selecione ou arraste o ficheiro"
                          removeFileButtonLabel="Remover ficheiro"
                          replaceFileButtonLabel="Substituir ficheiro"
                          extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
                          accept=".jpg,.jpeg,.png"
                          maxSize={4194304}
                          maxCount={1}
                          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
                          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                          hasError={!!imageError}
                          hasFeedback={!!imageError}
                          feedbackState="danger"
                          feedbackText={imageError ?? undefined}
                          onChange={handleImageUpload}
                        />
                      </div>
                      {post.image && (
                        <div className="mt-4 flex justify-center">
                          <img
                            src={post.image}
                            alt="Cobertura do artigo"
                            className="max-w-[200px] max-h-[150px] object-contain border border-neutral-200 rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-page__actions">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={handleSaveMetadata}
                      disabled={isSaving}
                    >
                      {isSaving ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>
                </form>

                <div className="dataset-edit-danger-actions">
                  {post.published ? (
                    <StatusCard
                      type="warning"
                      description={
                        <>
                          <strong>Retirar o artigo</strong>
                          <br />
                          Por favor, note que o item não será mais visível.
                          <br />
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                            onClick={handleUnpublish}
                            disabled={isSaving}
                          >
                            {isSaving ? "A retirar..." : "Retirar"}
                          </Button>
                        </>
                      }
                    />
                  ) : (
                    <StatusCard
                      type="info"
                      description={
                        <>
                          <strong>Artigo despublicado</strong>
                          <br />
                          Este artigo não está visível para o público.
                          <br />
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                            onClick={handleRepublish}
                            disabled={isSaving}
                          >
                            {isSaving ? "A publicar..." : "Publicar novamente"}
                          </Button>
                        </>
                      }
                    />
                  )}
                  <StatusCard
                    type="danger"
                    description={
                      <>
                        <strong>Atenção, esta ação não pode ser corrigida.</strong>
                        <br />
                        <Button
                          appearance="link"
                          variant="primary"
                          hasIcon
                          trailingIcon="agora-line-arrow-right-circle"
                          trailingIconHover="agora-solid-arrow-right-circle"
                          onClick={() => {
                            show(
                              <DeletePostPopupContent onClose={hide} onConfirm={handleDelete} />,
                              {
                                title: "Tem a certeza que quer eliminar este artigo?",
                                closeAriaLabel: "Fechar",
                                dimensions: "m",
                              }
                            );
                          }}
                          disabled={isSaving}
                        >
                          Eliminar o artigo
                        </Button>
                      </>
                    }
                  />
                </div>
              </div>
            </div>
          </TabBody>
        </Tab>

        {/* Conteúdo Tab */}
        <Tab>
          <TabHeader>Conteúdo</TabHeader>
          <TabBody>
            <div className="admin-page__body">
              <div className="admin-page__form-area">
                <form className="admin-page__form mt-[24px]">
                  <div className="admin-page__fields-group">
                    <div className="flex flex-col gap-[8px]">
                      <span className="text-primary-900 text-base font-medium leading-7">
                        Conteúdo *
                      </span>
                      <RichTextEditor
                        content={articleContent}
                        onChange={(html) => setArticleContent(html)}
                      />
                    </div>
                  </div>

                  <div className="admin-page__actions">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={handleSaveContent}
                      disabled={isSaving}
                    >
                      {isSaving ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
