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

interface GitHubArticlePageProps {
  slug: string;
  title?: string;
  breadcrumbItems: BreadcrumbItem[];
  initialContent?: string;
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-2xl-medium text-[#021C51] mb-16 leading-tight">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-bold text-[16px] leading-[28px] text-[#021c51] mb-[16px] mt-[16px]">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-bold text-[16px] leading-[28px] text-[#021c51] mb-[16px]">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="text-[16px] leading-[28px] mb-[16px]">{children}</p>
  ),
  a: ({ href, children }: any) => {
    const linkOverrides: Record<string, { href: string; text?: string }> = {
      "/docapi/": { href: "/pages/faqs/api-documentation" },
      "http://www.mejoratuescuela.org": {
        href: "https://www.redalyc.org/journal/5475/547567705004/",
      },
      "https://play.google.com/store/apps/details?id=be.tragewegen.brussels": {
        href: "https://data.europa.eu/sites/default/files/use-cases/use_case_belgium_-_be_walking_be.brussels.pdf",
      },
      "https://ogp.eportugal.gov.pt/": {
        href: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
      },
      "https://online-learning.iscte-iul.pt/bo/courses/plano-nacional-de-acao-de-administracao-aberta-pt": {
        href: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
        text: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
      },
      "/pt/pages/faqs/about_opendata/": { href: "/pages/about-open-data" },
      "/pages/faqs/licenses/": { href: "https://dados.gov.pt/pt/" },
    };
    const normalizedHref = href?.trim().replace(/^\/pt/, "");
    const override = linkOverrides[href] ?? linkOverrides[normalizedHref];
    const resolvedHref = override?.href ?? href;
    const resolvedChildren = override?.text ?? children;
    const isExternal = resolvedHref?.startsWith("http");
    return (
      <Link
        href={resolvedHref ?? "#"}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-[#034AD8] underline font-medium hover:text-primary-700"
      >
        {resolvedChildren}
      </Link>
    );
  },
  ul: ({ children }: any) => (
    <ul className="list-disc pl-[48px] space-y-[12px] mb-[24px] text-[16px] leading-[28px]">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-[48px] space-y-[12px] mb-[24px] text-[16px] leading-[28px]">
      {children}
    </ol>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-[#034AD8] pl-[16px] italic text-[16px] leading-[28px] mb-[16px]">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: any) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="bg-[#e1e4ea] rounded p-[16px] overflow-x-auto mb-[16px]">
        <code className="text-[14px] leading-[24px]">{children}</code>
      </pre>
    ) : (
      <code className="bg-[#e1e4ea] rounded px-[4px] py-[2px] text-[14px]">{children}</code>
    );
  },
  img: ({ src, alt }: any) => (
    <img src={src} alt={alt ?? ""} className="max-w-full h-auto mb-[16px] rounded" />
  ),
  strong: ({ children }: any) => <strong>{children}</strong>,
  em: ({ children }: any) => <em>{children}</em>,
  br: () => null,
};

function sanitizeMarkdown(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, "")
    .replace(/^\s*\n/gm, "\n")
    .replace(/\bdados gov\b/g, "dados.gov.pt");
}

export function GitHubArticlePage({
  slug,
  breadcrumbItems,
  initialContent = "",
}: GitHubArticlePageProps) {
  const editUrl = `${githubPagesConfig.repoBaseUrl}/${slug}.md`;
  const cleanContent = sanitizeMarkdown(initialContent);

  return (
    <div className="flex flex-col bg-white min-h-screen font-sans">
      <main className="flex-grow pt-32">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="pt-[32px] mb-[64px]">
            <Breadcrumb items={breadcrumbItems} />
          </div>

        </div>

        <div className="bg-[#F7F8FA] pt-[64px] pb-[38px] pl-[112px] pr-[112px]">
          <div className="container mx-auto px-4">
            {/* Main Content */}
            <div>
              <div className="text-[#2b363c] flex flex-col gap-[32px]">
                {cleanContent ? (
                  <div className="max-w-[592px]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={markdownComponents}
                    >
                      {cleanContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[16px] leading-[28px] text-[#2b363c]">
                    Não foi possível carregar o conteúdo.
                  </p>
                )}

                <div className="max-w-[592px] pt-[32px]">
                  <h1 className="text-[32px] font-medium text-[#021C51] mb-16 leading-tight max-w-[800px]">
                    Ações
                  </h1>
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
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
