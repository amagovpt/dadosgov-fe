"use client";

import Link from "next/link";
import { CardGeneral, Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { Post } from "@/service/types/posts";

interface ArticleCardProps {
  post: Post;
  formattedDate: string;
}

export function ArticleCard({ post, formattedDate }: ArticleCardProps) {
  const { t } = useTranslation("common");

  return (
    <Link
      href={`/noticias/${post.slug}`}
      className="card-general-listing flex h-full flex-col overflow-hidden rounded-4"
    >
      <CardGeneral
        variant="neutral-100"
        image={{
          src: post.image_thumbnail || post.image || "/laptop.png",
          alt: post.name,
          height: "56px",
          className: "bg-primary-100 !object-contain !h-56",
        }}
        subtitleText={
          (
            <span className="text-m-regular text-neutral-900">{formattedDate}</span>
          ) as unknown as string
        }
        titleText={post.name}
        descriptionText={
          (
            <div className="flex grow flex-col">
              {post.headline && (
                <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                  {post.headline}
                </p>
              )}
              <div className="mt-auto">
                <div className="mt-16 flex items-center gap-8 text-primary-600">
                  <span className="hover:underline text-m-regular">{t("readNews")}</span>
                  <Icon
                    name="agora-line-arrow-right-circle"
                    className="h-32 w-32"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          ) as unknown as string
        }
        isBlockedLink={true}
        anchor={{
          href: `/noticias/${post.slug}`,
        }}
      />
    </Link>
  );
}
