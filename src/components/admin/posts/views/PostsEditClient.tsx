"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
import type { Post } from "@/service/types/posts";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import PostsEditMetadataTab from "@/components/admin/posts/edit-tabs/PostsEditMetadataTab";
import PostsEditContentTab from "@/components/admin/posts/edit-tabs/PostsEditContentTab";
import {
  buildPostContentUpdatePayload,
  buildPostMetadataUpdatePayload,
  type PostFormField,
  validatePostContent,
  validatePostMetadata,
} from "@/components/admin/posts/form-state/postFormModel";

function DeletePostPopupContent({
  labels,
  onClose,
  onConfirm,
}: {
  labels: {
    description: string;
    cancel: string;
    delete: string;
  };
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>{labels.description}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {labels.delete}
        </Button>
      </div>
    </div>
  );
}

export default function PostsEditClient() {
  const { t } = useTranslation(["admin-common", "admin-posts"]);
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
  const {
    message: apiSuccess,
    setMessage: setApiSuccess,
    setTemporaryMessage: showApiSuccess,
  } = useTemporaryMessage<string | null>(null);
  const selectedKeywordsRef = useRef("");
  const { hasError, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors<PostFormField>();
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
    const errors = validatePostMetadata({
      title: articleTitle,
      header: articleHeader,
    }, {
      titleRequired: t("admin-posts:validation.titleRequired"),
      headerRequired: t("admin-posts:validation.headerRequired"),
    });
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const payload = buildPostMetadataUpdatePayload({
        title: articleTitle,
        header: articleHeader,
        contentType,
        articleType,
        tags: selectedTags,
      });

      const result = await updatePost(postId, payload);
      if (result) {
        setPost(result);
        showApiSuccess(t("admin-posts:edit.metadataSaved"));
      } else {
        setApiError(t("admin-posts:edit.saveAuthError"));
      }
    } catch {
      setApiError(t("admin-posts:edit.saveMetadataError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContent = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const errors = validatePostContent(articleContent, {
      contentRequired: t("admin-posts:validation.contentRequired"),
    });
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const payload = buildPostContentUpdatePayload(articleContent);

      const result = await updatePost(postId, payload);
      if (result) {
        setPost(result);
        showApiSuccess(t("admin-posts:edit.contentSaved"));
      } else {
        setApiError(t("admin-posts:edit.saveAuthError"));
      }
    } catch {
      setApiError(t("admin-posts:edit.saveContentError"));
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
        showApiSuccess(t("admin-posts:edit.unpublishedSuccess"));
      } else {
        setApiError(t("admin-posts:edit.unpublishAuthError"));
      }
    } catch {
      setApiError(t("admin-posts:edit.unpublishError"));
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
        showApiSuccess(t("admin-posts:edit.publishedSuccess"));
      } else {
        setApiError(t("admin-posts:edit.publishAuthError"));
      }
    } catch {
      setApiError(t("admin-posts:edit.publishError"));
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
        router.push("/admin/system/posts");
      } else {
        setApiError(t("admin-posts:edit.deleteAuthError"));
      }
    } catch {
      setApiError(t("admin-posts:edit.deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files.length) return;

    const file = files[0];
    if (file.size > 4194304) {
      setImageError(t("admin-posts:edit.imageMaxSize"));
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
        showApiSuccess(t("admin-posts:edit.imageUploaded"));
      } else {
        setApiError(t("admin-posts:edit.imageUploadError"));
      }
    } catch {
      setApiError(t("admin-posts:edit.imageUploadError"));
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
        <p>{t("admin-posts:edit.loading")}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="admin-page">
        <p>{t("admin-posts:edit.notFound")}</p>
      </div>
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-posts:new.breadcrumbsHome"), url: "/admin" },
        { label: t("admin-posts:title"), url: "/admin/system/posts" },
        { label: post.name },
      ]}
      title={post.name}
      headerAction={
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => window.open(`/posts/${post.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="w-16 h-16" />
            {t("admin-posts:edit.viewPage")}
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
          <TabHeader>{t("admin-posts:edit.metadataTab")}</TabHeader>
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
                show(
                  <DeletePostPopupContent
                    labels={{
                      description: t("admin-posts:edit.deletePopupDescription"),
                      cancel: t("admin-common:actions.cancel"),
                      delete: t("admin-common:actions.delete"),
                    }}
                    onClose={hide}
                    onConfirm={handleDelete}
                  />,
                  {
                    title: t("admin-posts:edit.deletePopupTitle"),
                    closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
                    dimensions: "m",
                  }
                );
              }}
            />
          </TabBody>
        </Tab>

        <Tab>
          <TabHeader>{t("admin-posts:edit.contentTab")}</TabHeader>
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
