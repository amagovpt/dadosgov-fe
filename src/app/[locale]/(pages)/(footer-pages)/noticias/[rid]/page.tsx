import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { fetchPost } from "@/service/api/posts";
import { formatPostDate } from "@/utils/articlesListing";
import initTranslations from "@/app/i18n";

const POST_REVALIDATE_SECONDS = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; rid: string }>;
}): Promise<Metadata> {
  const { locale, rid } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["common"] });
  const post = await fetchPost(rid, { revalidate: POST_REVALIDATE_SECONDS });

  if (!post) {
    return {
      title: `${t("articleNotFound")} - dados.gov.pt`,
      description: t("articleNotFoundDescription"),
    };
  }

  return {
    title: `${post.name} - dados.gov.pt`,
    description: post.headline || undefined,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; rid: string }>;
}) {
  const { locale, rid } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["common"] });
  const post = await fetchPost(rid, { revalidate: POST_REVALIDATE_SECONDS });

  if (!post) {
    notFound();
  }

  const displayDate = formatPostDate(post, locale);

  return (
    <main className="min-h-screen flex-grow bg-white">
      <div className="container mx-auto pt-32">
        {/* Breadcrumb */}
        <div>
          <BreadcrumbDynamic darkMode={false} currentLabel={post.name} />
        </div>

        {/* Title Section */}
        <div>
          <p className="mb-8 mt-64 text-[20px] font-normal text-[#021C51]">
            {t("publishedAt", { date: displayDate })}
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
                  <Image
                    src={post.image}
                    alt={post.name}
                    width={1184}
                    height={666}
                    unoptimized
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
                  {t("credits")}:{" "}
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
