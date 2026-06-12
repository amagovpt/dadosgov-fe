"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@ama-pt/agora-design-system";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { fetchPost } from "@/service/api/posts";
import { Post } from "@/service/types/posts";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import TextLink from "@/components/Primitives/TextLink";

interface ArticleDetailProps {
  rid: string;
}

export default function ArticleDetail({ rid }: ArticleDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const postData = await fetchPost(rid);

        if (!postData) {
          setNotFound(true);
          return;
        }

        setPost(postData);
      } catch (error) {
        console.error("Error loading article:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [rid]);

  const formatPostDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-neutral-600">A carregar artigo...</span>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-16">
        <h1 className="text-2xl-bold text-neutral-900">Artigo não encontrado</h1>
        <p className="text-neutral-600">O artigo que procura não existe ou foi removido.</p>
        <TextLink href="/pages/posts" className="hover:text-primary-700">
          Voltar aos artigos
        </TextLink>
      </div>
    );
  }

  const displayDate = formatPostDate(post.published || post.created_at);

  return (
    <main className="min-h-screen flex-grow bg-white">
      <div className="container mx-auto pt-32">
        {/* Breadcrumb */}
        <div>
          <Breadcrumb
            items={[
              { label: "Início", url: "/" },
              { label: "Notícias", url: "/pages/posts" },
              { label: post.name, url: "#" },
            ]}
          />
        </div>

        {/* Title Section */}
        <div>
          <p className="mb-8 mt-64 text-[20px] font-normal text-[#021C51]">
            Publicado em {displayDate}
          </p>
          <h1 className="mb-16 text-32 font-normal leading-[48px] text-[#021C51]">{post.name}</h1>
          {post.headline && (
            <p className="mb-32 max-w-2xl text-m-regular font-normal text-[#64718B]">
              {post.headline}
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#F7F8FA] pb-[38px] pt-64">
        <div className="container mx-auto">
          <div className="flex flex-col gap-32 text-[#2b363c]">
            <div className="max-w-[592px]">
              {/* Article Image */}
              {post.image && (
                <div className="rounded mb-32 overflow-hidden bg-neutral-100">
                  <img
                    src={post.image}
                    alt={post.name}
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="markdown-container text-m-regular leading-7">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {post.content.replace(/\n&nbsp;\s*\n/g, "\n\n")}
                </ReactMarkdown>
              </div>

              {/* Credits */}
              {post.credit_to && (
                <p className="mt-16 text-s-regular text-neutral-500">
                  Créditos:{" "}
                  {post.credit_url ? (
                    <a
                      href={post.credit_url}
                      className="font-medium text-[#034AD8] underline hover:text-primary-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.credit_to}
                    </a>
                  ) : (
                    post.credit_to
                  )}
                </p>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-8 pt-32">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs rounded-4 bg-neutral-100 px-12 py-4 text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
