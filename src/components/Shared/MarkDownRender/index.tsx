
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import Image from "next/image";
import Link from "next/link";

export default function MarkDownRender({ body }: {
    body: string
}) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
                h1: ({ children }) => (
                    <h1 className="text-2xl-medium text-primary-900 mb-16 leading-tight">
                        {children}
                    </h1>),
                h2: ({ children }) => (
                    <h2 className="my-16 text-m-regular font-bold leading-7 text-primary-900">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="mb-16 text-m-regular font-bold leading-7 text-primary-900">{children}</h3>
                ),
                p: ({ children }) => <p className="mb-16 text-m-regular leading-7">{children}</p>,
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
                    <ul className="mb-24 list-disc space-y-12 pl-48 text-m-regular leading-7">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="mb-24 list-decimal space-y-12 pl-48 text-m-regular leading-7">{children}</ol>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="mb-16 border-l-4 border-primary-600 pl-16 text-m-regular italic leading-7">
                        {children}
                    </blockquote>
                ),
                code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    return isBlock ? (
                        <pre className="rounded mb-16 overflow-x-auto bg-neutral-200 p-16">
                            <code className="text-s-regular leading-6">{children}</code>
                        </pre>
                    ) : (
                        <code className="rounded bg-neutral-200 px-4 py-2 text-[14px]">{children}</code>
                    );
                },
                img: ({ src, alt }) => (
                    <Image
                        src={String(src) || ""}
                        alt={alt ?? ""}
                        width={800}
                        height={600}
                        className="max-w-full h-auto mb-16 rounded"
                    />),
                strong: ({ children }) => <strong>{children}</strong>,
                em: ({ children }) => <em>{children}</em>,
                br: () => null,
            }}
        >
            {body}
        </ReactMarkdown>
    )
}
