import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type { PostCreatePayload, PostUpdatePayload } from "@/service/types/posts";

export type PostFormField = "articleTitle" | "articleHeader" | "articleContent";

interface PostMetadataValues {
  title: string;
  header: string;
  requireHeader?: boolean;
}

interface PostCreateValues {
  title: string;
  header: string;
  content: string;
  contentType: string;
  tags: string[];
}

interface PostMetadataUpdateValues {
  title: string;
  header: string;
  contentType: string;
  articleType: string;
  tags: string[];
}

export function validatePostMetadata(
  values: PostMetadataValues,
): FormErrors<PostFormField> {
  const errors: FormErrors<PostFormField> = {};

  if (!values.title.trim()) errors.articleTitle = "Indique o título do artigo.";
  if (values.requireHeader && !values.header.trim()) {
    errors.articleHeader = "Indique o cabeçalho do artigo.";
  }

  return errors;
}

export function validatePostContent(content: string): FormErrors<PostFormField> {
  return content.trim()
    ? {}
    : { articleContent: "Adicione o conteúdo do artigo." };
}

export function buildPostCreatePayload(values: PostCreateValues): PostCreatePayload {
  return {
    name: values.title.trim(),
    headline: values.header.trim(),
    content: values.content.trim(),
    body_type: values.contentType,
    tags: values.tags,
  };
}

export function buildPostMetadataUpdatePayload(
  values: PostMetadataUpdateValues,
): PostUpdatePayload {
  return {
    name: values.title.trim(),
    headline: values.header.trim(),
    body_type: values.contentType,
    kind: values.articleType,
    tags: values.tags,
  };
}

export function buildPostContentUpdatePayload(content: string): PostUpdatePayload {
  return { content: content.trim() };
}
