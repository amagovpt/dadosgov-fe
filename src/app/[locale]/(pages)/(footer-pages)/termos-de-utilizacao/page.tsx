import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm"; import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { getFaqs } from "@/service/queries/faqs/faqs";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  {
    //params,
  }: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const { title } = await getFaqs("termos-de-utilizacao", "pt");

  return {
    title,
  };
}

export default async function TermsPage() {
  const { title, body } = await getFaqs("termos-de-utilizacao", "pt");


  return (
    <main className="flex flex-col pt-32 pb-64 bg-white gap-64 justify-center items-center w-full h-full">
      <div className="container ">
        <Breadcrumb items={[
          { label: "Início", url: "/" },
          { label: title, url: "/termos-de-utilizacao" },
        ]} />
      </div>

      <div className="bg-neutral-100 flex flex-col items-center justify-center py-64 w-full h-full">
        <div className="container">
          <div className="max-w-[592px]">
            {body ? (
              <div className="text-neutral-900 flex flex-col gap-16">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
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
                      const isPortalLink = href?.startsWith("/");
                      const resolvedHref =
                        isPortalLink || isExternal
                          ? (href ?? "#")
                          : href
                            ? `${href}`
                            : "#";
                      const openInNewTab = isExternal;
                      return (
                        <Link
                          href={resolvedHref}
                          target={openInNewTab ? "_blank" : undefined}
                          rel={openInNewTab ? "noopener noreferrer" : undefined}
                          className="text-primary-600 underline font-medium hover:text-primary-700"
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
                      <blockquote className="border-l-4 border-primary-600 pl-16 italic text-m-regular leading-7 mb-16">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <pre className="bg-[#e1e4ea] rounded p-16 overflow-x-auto mb-16">
                          <code className="text-s-regular leading-6">{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-[#e1e4ea] rounded px-4 py-2 text-s-regular">
                          {children}
                        </code>
                      );
                    },
                    img: ({ src, alt }) => (
                      <Image
                        src={String(src) || ""}
                        alt={alt ?? ""}
                        className="max-w-full h-auto mb-16 rounded"
                      />
                    ),
                    strong: ({ children }) => <strong>{children}</strong>,
                    em: ({ children }) => <em>{children}</em>,
                    br: () => null,
                  }}
                >
                  {body}
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
    </main>
  );
}
