"use client";

import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Breadcrumb } from "@ama-pt/agora-design-system";
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

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-16 text-2xl-medium leading-tight text-[#021C51]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="my-16 text-m-regular font-bold leading-7 text-[#021c51]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-16 text-m-regular font-bold leading-7 text-[#021c51]">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-16 text-m-regular leading-7">{children}</p>,
  a: ({ href, children }) => {
    const linkOverrides: Record<string, { href: string; text?: string }> = {
      "/docapi/": { href: "/recursos/desenvolvimento/referencia-api" },
      "http://www.mejoratuescuela.org": {
        href: "https://www.redalyc.org/journal/5475/547567705004/",
      },
      "https://play.google.com/store/apps/details?id=be.tragewegen.brussels": {
        href: "https://data.europa.eu/sites/default/files/use-cases/use_case_belgium_-_be_walking_be.brussels.pdf",
      },
      "https://ogp.eportugal.gov.pt/": {
        href: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
      },
      "https://online-learning.iscte-iul.pt/bo/courses/plano-nacional-de-acao-de-administracao-aberta-pt":
        {
          href: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
          text: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
        },
      "/pt/faqs/about_opendata/": { href: "/recursos/como-usar-o-portal/sobre-dados-abertos" },
      "/faqs/licenses/": { href: "/" },
    };
    const normalizedHref = href?.trim().replace(/^\/pt/, "");
    const override = linkOverrides[href ?? ""] ?? linkOverrides[normalizedHref ?? ""];
    const resolvedHref = override?.href ?? href;
    const resolvedChildren = override?.text ?? children;
    const isExternal = resolvedHref?.startsWith("http");
    return (
      <Link
        href={resolvedHref ?? "#"}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium text-[#034AD8] underline hover:text-primary-700"
      >
        {resolvedChildren}
      </Link>
    );
  },
  ul: ({ children }) => (
    <ul className="mb-24 list-disc space-y-12 pl-48 text-m-regular leading-7">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-24 list-decimal space-y-12 pl-48 text-m-regular leading-7">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-16 border-l-4 border-[#034AD8] pl-16 text-m-regular italic leading-7">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="rounded mb-16 overflow-x-auto bg-[#e1e4ea] p-16">
        <code className="text-s-regular leading-6">{children}</code>
      </pre>
    ) : (
      <code className="rounded bg-[#e1e4ea] px-[4px] py-[2px] text-[14px]">{children}</code>
    );
  },
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="rounded mb-[16px] h-auto max-w-full" />
  ),
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  br: () => null,
};

function sanitizeMarkdown(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, "")
    .replace(/^\s*\n/gm, "\n")
    .replace(/\bdados gov\b/g, "dados.gov.pt")
    .replace(
      /A certificação pode ser pedida através do e-mail dados@ama\.pt\./g,
      "O pedido de certificação deve ser realizado através da página [Ajuda e Contactos](/ajuda-e-contactos)."
    )
    .replace(
      /A ARTE também poderá ajudar neste processo, incluindo colaborar na organização de workshops \/ eventos com vista a promover estas interações, contacte-nos em dados@ama\.pt\./g,
      "A ARTE também poderá apoiar este processo, nomeadamente através da colaboração na organização de workshops e eventos que promovam estas interações. Para mais informações, consulte a página [Ajuda e Contactos](/ajuda-e-contactos)."
    )
    .replace(
      /Para pedidos de certificação, enviar e-mail para: dados@ama\.pt\./g,
      "Para pedidos de certificação, consulte a página [Ajuda e Contactos](/ajuda-e-contactos)."
    );
}

export function GitHubArticlePage({
  slug,
  breadcrumbItems,
  initialContent = "",
}: GitHubArticlePageProps) {
  const cleanContent = sanitizeMarkdown(initialContent);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <main className="flex-grow pt-32">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="mb-[64px] pt-[32px]">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <div className="bg-[#F7F8FA] pb-[38px] pl-[112px] pr-[112px] pt-[64px]">
          <div className="container mx-auto px-4">
            {/* Main Content */}
            <div>
              <div className="flex flex-col gap-[32px] text-[#2b363c]">
                {cleanContent ? (
                  <div className="max-w-[592px]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={markdownComponents}
                    >
                      {cleanContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-m-regular leading-7 text-[#2b363c]">
                    Não foi possível carregar o conteúdo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
