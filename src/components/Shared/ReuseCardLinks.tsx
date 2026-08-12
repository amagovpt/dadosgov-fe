"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CardLinks } from "@ama-pt/agora-design-system";
import { Reuse } from "@/service/types/reuse";
import { formatDateToDMY } from "@/utils/formatDate";
import { sanitizeUserMarkdown } from "@/utils/sanitizeUserMarkdown";

interface ReuseCardLinksProps {
  reuse: Reuse;
  showDatasetsCount?: boolean;
}

export function ReuseCardLinks({ reuse, showDatasetsCount = false }: ReuseCardLinksProps) {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();

  const links = [
    {
      href: "#",
      hasIcon: true,
      leadingIcon: "agora-line-eye",
      leadingIconHover: "agora-solid-eye",
      trailingIcon: "",
      trailingIconHover: "",
      trailingIconActive: "",
      children: reuse.metrics?.views?.toLocaleString("pt-PT") || "0",
      title: t("card.views"),
      onClick: (e: React.MouseEvent) => e.preventDefault(),
      className: "text-[#034AD8]",
    },
    ...(showDatasetsCount
      ? [
          {
            href: "#",
            hasIcon: true,
            leadingIcon: "agora-line-layers-menu",
            leadingIconHover: "agora-solid-layers-menu",
            trailingIcon: "",
            trailingIconHover: "",
            trailingIconActive: "",
            children: t("card.datasetsCount", { count: reuse.datasets?.length || 0 }),
            title: t("card.datasets"),
            onClick: (e: React.MouseEvent) => e.preventDefault(),
            className: "text-[#034AD8]",
          },
        ]
      : []),
    {
      href: "#",
      hasIcon: true,
      leadingIcon: "agora-line-star",
      leadingIconHover: "agora-solid-star",
      trailingIcon: "",
      trailingIconHover: "",
      trailingIconActive: "",
      children: reuse.metrics?.followers || 0,
      title: t("card.favorites"),
      onClick: (e: React.MouseEvent) => e.preventDefault(),
      className: "text-[#034AD8]",
    },
  ];

  return (
    <div className="h-full">
      <CardLinks
        onClick={() => router.push(`/reuses/${reuse.slug}`)}
        className="cursor-pointer text-neutral-900"
        variant="transparent"
        image={{
          src: reuse.image_thumbnail || reuse.image || "/laptop.png",
          alt: sanitizeUserMarkdown(reuse.title),
        }}
        category={
          reuse.organization?.name ||
          (reuse.owner
            ? `${reuse.owner.first_name} ${reuse.owner.last_name}`.trim()
            : t("card.reuse"))
        }
        title={
          <div className="text-xl-bold underline">{sanitizeUserMarkdown(reuse.title)}</div>
        }
        description={
          reuse.description ? (
            <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
              {sanitizeUserMarkdown(reuse.description)}
            </p>
          ) : undefined
        }
        date={
          <span className="font-[300]">
            {t("card.updated", {
              date: formatDateToDMY(reuse.last_modified || reuse.created_at),
            })}
          </span>
        }
        links={links}
        mainLink={
          <Link href={`/reuses/${reuse.slug}`}>
            <span className="underline">{sanitizeUserMarkdown(reuse.title)}</span>
          </Link>
        }
        blockedLink={true}
      />
    </div>
  );
}
