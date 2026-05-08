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
    <main className="w-full flex flex-col justify-center items-center pt-32 gap-32">
      <div className="container ">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="w-full flex flex-col justify-center items-center py-64 bg-primary-100 ">
        <div className="container ">
          <div className="max-w-[592px]">
            {cleanContent ? (
              <div className="text-neutral-900 flex flex-col gap-16">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl-medium text-primary-900 mb-16 leading-tight">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-bold text-m-regular leading-7 text-primary-900 mb-16 mt-16">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-bold text-m-regular leading-7 text-primary-900 mb-16">
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
                          className="text-primary-700 underline font-medium hover:text-primary-700"
                        >
                          {children}
                        </Link>
                      );
                    },
                    ul: ({ children }) => (
                      <ul className="list-disc pl-48 space-y-12 mb-24 text-m-regular leading-7">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-48 space-y-12 mb-24 text-m-regular leading-7">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary-700 pl-16 italic text-m-regular leading-7 mb-16">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <pre className="bg-neutral-200 rounded p-16 overflow-x-auto mb-16">
                          <code className="text-s-regular leading-6">{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-neutral-200 rounded px-4 py-2 text-s-regular">
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
                  <h2 className="text-32 font-medium text-primary-900 mb-16 leading-tight">
                    Ações
                  </h2>
                  <Link
                    href={editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-700 underline font-medium hover:text-primary-700"
                  >
                    Propor uma mudança
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-m-regular leading-7 text-primary-900">
                Não foi possível carregar o conteúdo.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
