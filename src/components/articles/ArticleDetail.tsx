"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@ama-pt/agora-design-system";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { fetchPost } from "@/services/api";
import { Post } from "@/types/api";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
      <div className="flex justify-center items-center min-h-screen">
        <span className="text-neutral-600">A carregar artigo...</span>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-16">
        <h1 className="text-2xl-bold text-neutral-900">Artigo não encontrado</h1>
        <p className="text-neutral-600">O artigo que procura não existe ou foi removido.</p>
        <Link href="/pages/posts" className="text-primary-600 underline hover:text-primary-700">
          Voltar aos artigos
        </Link>
      </div>
    );
  }

  const displayDate = formatPostDate(post.published || post.created_at);

  return (
    <main className="flex-grow bg-white min-h-screen">
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
          <p className="text-[20px] font-normal text-[#021C51] mt-64 mb-[8px]">
            Publicado em {displayDate}
          </p>
          <h1 className="text-[32px] font-normal text-[#021C51] mb-[16px] leading-[48px]">{post.name}</h1>
          {post.headline && (
            <p className="text-[16px] font-normal text-[#64718B] max-w-2xl mb-32">{post.headline}</p>
          )}
        </div>
      </div>

      <div className="bg-[#F7F8FA] pt-[64px] pb-[38px]">
        <div className="container mx-auto">
          <div className="text-[#2b363c] flex flex-col gap-[32px]">
            <div className="max-w-[592px]">
                {/* Content */}
                <div className="text-[16px] leading-[28px]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                {/* Article Image */}
                {post.image && (
                  <div className="mt-[32px] rounded overflow-hidden bg-neutral-100">
                    <img
                      src={post.image}
                      alt={post.name}
                      className="w-full object-cover aspect-[16/9]"
                    />
                  </div>
                )}

                {/* Credits */}
                {post.credit_to && (
                  <p className="text-[14px] text-neutral-500 mt-[16px]">
                    Créditos:{" "}
                    {post.credit_url ? (
                      <a
                        href={post.credit_url}
                        className="text-[#034AD8] underline font-medium hover:text-primary-700"
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
                  <div className="flex flex-wrap gap-8 pt-[32px]">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-12 py-4 bg-neutral-100 text-neutral-700 text-xs rounded-4"
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
