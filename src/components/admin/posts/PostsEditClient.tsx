"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Icon,
  StatusCard,
  Tab,
  TabBody,
  TabHeader,
  Tabs,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import {
  deletePost,
  fetchPost,
  publishPost,
  unpublishPost,
  updatePost,
  uploadPostImage,
} from "@/service/api/posts";
import type { Post, PostUpdatePayload } from "@/service/types/posts";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import PostsEditMetadataTab from "@/components/admin/posts/PostsEditMetadataTab";
import PostsEditContentTab from "@/components/admin/posts/PostsEditContentTab";

function DeletePostPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
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
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const selectedKeywordsRef = useRef("");
  const { hasError, setError, clearError, resetErrors, scrollToFirstError } = useFormErrors();
  const { setKeywordSearch, keywordOptions, registerSelectedKeywordValue } = useKeywordSelect({
    selectedKeywords: selectedTags,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const postData = await fetchPost(postId);

        if (postData) {
          setPost(postData);
          setArticleTitle(postData.name || "");
          setArticleHeader(postData.headline || "");
          setArticleContent(postData.content || "");
          setContentType(postData.body_type || "markdown");
          setArticleType(postData.kind || "news");
          const initial = postData.tags || [];
          setSelectedTags(initial);
          selectedKeywordsRef.current = initial.join(",");
        }
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [postId]);

  const handleSaveMetadata = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!articleTitle.trim()) {
      setError("articleTitle");
      scrollToFirstError();
      return;
    }

    resetErrors();
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
    if (!articleContent.trim()) {
      setError("articleContent");
      scrollToFirstError();
      return;
    }

    resetErrors();
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
    hide();
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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

  const handleKeywordsChange = (value: string) => {
    const selected = value.split(",").filter(Boolean);
    setSelectedTags(selected);

    let addedNew = false;
    selected.forEach((tag) => {
      addedNew = true;
      registerSelectedKeywordValue(tag);
    });

    if (addedNew) {
      setKeywordSearch("");
    }
  };

  const handleRemoveTag = (keyword: string) => {
    const next = selectedTags.filter((value) => value.toLowerCase() !== keyword.toLowerCase());
    setSelectedTags(next);
    selectedKeywordsRef.current = next.join(",");
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
    <AdminLayout
      breadcrumbItems={[
        { label: "Bem-vindo", url: "/pages/admin" },
        { label: "Artigos", url: "/pages/admin/system/posts" },
        { label: post.name },
      ]}
      title={post.name}
      headerAction={
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => window.open(`/pages/posts/${post.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="w-16 h-16" />
            Veja a página do artigo
          </span>
        </Button>
      }
    >
      {apiError && <StatusCard variant="danger" showIcon description={apiError} />}
      {apiSuccess && <StatusCard variant="success" showIcon description={apiSuccess} />}

      <Tabs
        className="mt-8"
        onTabActivation={() => {
          setApiError(null);
          setApiSuccess(null);
        }}
      >
        <Tab>
          <TabHeader>Metadados</TabHeader>
          <TabBody>
            <PostsEditMetadataTab
              post={post}
              articleTitle={articleTitle}
              articleHeader={articleHeader}
              articleType={articleType}
              contentType={contentType}
              selectedTags={selectedTags}
              keywordOptions={keywordOptions}
              selectedKeywordsRef={selectedKeywordsRef}
              imageError={imageError}
              hasTitleError={hasError("articleTitle")}
              hasHeaderError={false}
              isSaving={isSaving}
              onTitleChange={(event) => {
                setArticleTitle(event.target.value);
                if (event.target.value.trim()) {
                  clearError("articleTitle");
                }
              }}
              onHeaderChange={(event) => setArticleHeader(event.target.value)}
              onArticleTypeChange={setArticleType}
              onContentTypeChange={setContentType}
              onKeywordSearchChange={setKeywordSearch}
              onKeywordsChange={handleKeywordsChange}
              onRemoveTag={handleRemoveTag}
              onImageChange={handleImageUpload}
              onImageSecurityError={() => setImageError(POISONED_FILE_WARNING)}
              onSaveMetadata={handleSaveMetadata}
              onUnpublish={handleUnpublish}
              onRepublish={handleRepublish}
              onOpenDeletePopup={() => {
                show(<DeletePostPopupContent onClose={hide} onConfirm={handleDelete} />, {
                  title: "Tem a certeza que quer eliminar este artigo?",
                  closeAriaLabel: "Fechar",
                  dimensions: "m",
                });
              }}
            />
          </TabBody>
        </Tab>

        <Tab>
          <TabHeader>Conteúdo</TabHeader>
          <TabBody>
            <PostsEditContentTab
              articleContent={articleContent}
              hasContentError={hasError("articleContent")}
              isSaving={isSaving}
              onContentChange={(value) => {
                setArticleContent(value);
                if (value.trim()) {
                  clearError("articleContent");
                }
              }}
              onSaveContent={handleSaveContent}
            />
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
