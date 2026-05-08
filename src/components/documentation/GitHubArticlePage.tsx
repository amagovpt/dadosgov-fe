
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { githubPagesConfig } from "@/config/site";
import Image from "next/image";
import Breadcrumb from "../Primitives/Breadcrumb/Breadcrumb";

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

interface MarkdownComponentProps {
  children?: React.ReactNode;
}

interface LinkComponentProps {
  href?: string;
  children?: React.ReactNode;
}

interface CodeComponentProps {
  children?: React.ReactNode;
  className?: string;
}

interface ImageComponentProps {
  src?: string | Blob;
  alt?: string;
}

const markdownComponents = {
  h1: ({ children }: MarkdownComponentProps) => (
    <h1 className="mb-16 text-2xl-medium leading-tight text-primary-900">{children}</h1>
  ),
  h2: ({ children }: MarkdownComponentProps) => (
    <h2 className="my-16 text-m-regular font-bold leading-7 text-primary-900">{children}</h2>
  ),
  h3: ({ children }: MarkdownComponentProps) => (
    <h3 className="mb-16 text-m-regular font-bold leading-7 text-primary-900">{children}</h3>
  ),
  p: ({ children }: MarkdownComponentProps) => <p className="mb-16 text-m-regular leading-7">{children}</p>,
  a: ({ href, children }: LinkComponentProps) => {
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
      "https://online-learning.iscte-iul.pt/bo/courses/plano-nacional-de-acao-de-administracao-aberta-pt":
      {
        href: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
        text: "https://online-learning.iscte-iul.pt/login/required?show_warning=true",
      },
      "/pt/pages/faqs/about_opendata/": { href: "/pages/about-open-data" },
      "/pages/faqs/licenses/": { href: "https://dados.gov.pt/pt/" },
    };
    const normalizedHref = href?.trim().replace(/^\/pt/, "");
    const override = (href && linkOverrides[href]) ?? (normalizedHref && linkOverrides[normalizedHref]);
    const resolvedHref = (typeof override === 'object' ? override?.href : undefined) ?? href;
    const resolvedChildren = (typeof override === 'object' ? override?.text : undefined) ?? children;
    const isExternal = resolvedHref?.startsWith("http");
    return (
      <Link
        href={resolvedHref ?? "#"}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium text-primary-800 underline hover:text-primary-700"
      >
        {resolvedChildren}
      </Link>
    );
  },
  ul: ({ children }: MarkdownComponentProps) => (
    <ul className="mb-24 text-m-regular list-disc space-y-12 pl-48 leading-7">{children}</ul>
  ),
  ol: ({ children }: MarkdownComponentProps) => (
    <ol className="mb-24 list-decimal space-y-12 pl-48 text-m-regular leading-7">{children}</ol>
  ),
  blockquote: ({ children }: MarkdownComponentProps) => (
    <blockquote className="mb-16 border-l-4 border-primary-700 pl-16 text-m-regular italic leading-7">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: CodeComponentProps) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="rounded mb-16 overflow-x-auto bg-primary-200 p-16">
        <code className="text-s-regular leading-6">{children}</code>
      </pre>
    ) : (
      <code className="rounded bg-primary-200 px-4 py-2 text-[14px]">{children}</code>
    );
  },
  img: ({ src, alt }: ImageComponentProps) => {
    if (!src) return null;
    return (
      <Image src={src as string} alt={alt ?? ""} className="rounded mb-16 h-auto max-w-full" />
    );
  },
  strong: ({ children }: MarkdownComponentProps) => <strong>{children}</strong>,
  em: ({ children }: MarkdownComponentProps) => <em>{children}</em>,
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
    <main className="w-full flex flex-col justify-center items-center pt-32 gap-32">
      <div className="container ">
        {/* Breadcrumbs */}
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="w-full bg-neutral-50 py-64 flex flex-col justify-center items-center">
        <div className="container">
          {/* Main Content */}
          <div>
            <div className="flex flex-col gap-32 text-neutral-900">
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
                <p className="text-m-regular leading-7 text-neutral-900">
                  Não foi possível carregar o conteúdo.
                </p>
              )}

              <div className="max-w-[592px] pt-32">
                <h1 className="mb-16 max-w-[800px] text-3 pt-32 font-medium leading-tight text-primary-900">
                  Ações
                </h1>
                <Link
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-800 underline hover:text-primary-700"
                >
                  Propor uma mudança
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
