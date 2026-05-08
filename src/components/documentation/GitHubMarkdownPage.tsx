"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Breadcrumb } from "@ama-pt/agora-design-system";
import { githubPagesConfig } from "@/config/site";

interface BreadcrumbItem {
  label: string;
  url: string;
}

interface GitHubMarkdownPageProps {
  /** Path relative to the repo root, e.g. "pages/faqs/about_dadosgov" (without .md) */
  slug: string;
  title: string;
  breadcrumbItems: BreadcrumbItem[];
  initialContent?: string;
}

function sanitizeMarkdown(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, "")
    .replace(/^\s*\n/gm, "\n")
    .replace(/\bdados gov\b/g, "dados.gov.pt");
}

export function GitHubMarkdownPage({
  slug,
  title,
  breadcrumbItems,
  initialContent = "",
}: GitHubMarkdownPageProps) {
  const editUrl = `${githubPagesConfig.repoBaseUrl}/${slug}.md`;
  const cleanContent = sanitizeMarkdown(initialContent);

  return (
    <div className="flex flex-col bg-white min-h-screen font-sans">
      <main className="flex-grow pt-32 pb-64">
        <div className="container mx-auto px-4">
          <div className="pt-32 mb-[64px]">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="bg-[#F7F8FA] pt-64 pb-[38px] pl-[112px] pr-[112px]">
          <div className="container mx-auto px-4">
            <div className="max-w-[592px]">
              {cleanContent ? (
                <div className="text-[#2b363c] flex flex-col gap-16">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl-medium text-[#021C51] mb-16 leading-tight">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="font-bold text-m-regular leading-7 text-[#021c51] mb-16 mt-16">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="font-bold text-m-regular leading-7 text-[#021c51] mb-16">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-m-regular leading-7 mb-16">{children}</p>
                      ),
                      a: ({ href, children }) => {
                        const isExternal = href?.startsWith("http");
                        const resolvedHref =
                          href && !isExternal
                            ? `https://dados.gov.pt/pt${href}`
                            : (href ?? "#");
                        return (
                          <Link
                            href={resolvedHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#034AD8] underline font-medium hover:text-primary-700"
                          >
                            {children}
                          </Link>
                        );
                      },
                      ul: ({ children }) => (
                        <ul className="list-disc pl-48 space-y-[12px] mb-[24px] text-m-regular leading-7">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-48 space-y-[12px] mb-[24px] text-m-regular leading-7">
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#034AD8] pl-16 italic text-m-regular leading-7 mb-16">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        return isBlock ? (
                          <pre className="bg-[#e1e4ea] rounded p-[16px] overflow-x-auto mb-16">
                            <code className="text-s-regular leading-6">{children}</code>
                          </pre>
                        ) : (
                          <code className="bg-[#e1e4ea] rounded px-4 py-2 text-s-regular">
                            {children}
                          </code>
                        );
                      },
                      img: ({ src, alt }) => (
                        <img
                          src={src}
                          alt={alt ?? ""}
                          className="max-w-full h-auto mb-16 rounded"
                        />
                      ),
                      strong: ({ children }) => <strong>{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      br: () => null,
                    }}
                  >
                    {cleanContent}
                  </ReactMarkdown>

                  <div className="pt-32">
                    <h2 className="text-[32px] font-medium text-[#021C51] mb-16 leading-tight">
                      Ações
                    </h2>
                    <Link
                      href={editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#034AD8] underline font-medium hover:text-primary-700"
                    >
                      Propor uma mudança
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-m-regular leading-7 text-[#2b363c]">
                  Não foi possível carregar o conteúdo.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
