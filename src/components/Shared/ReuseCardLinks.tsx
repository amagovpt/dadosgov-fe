"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardLinks } from "@ama-pt/agora-design-system";
import { Reuse } from "@/service/types/reuse";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { sanitizeUserMarkdown } from "@/utils/sanitizeUserMarkdown";

interface ReuseCardLinksProps {
  reuse: Reuse;
  showDatasetsCount?: boolean;
}

export function ReuseCardLinks({ reuse, showDatasetsCount = false }: ReuseCardLinksProps) {
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
      title: "Visualizações",
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
            children: `${reuse.datasets?.length || 0} datasets`,
            title: "Datasets",
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
      title: "Favoritos",
      onClick: (e: React.MouseEvent) => e.preventDefault(),
      className: "text-[#034AD8]",
    },
  ];

  return (
    <div className="h-full">
      <CardLinks
        onClick={() => router.push(`/pages/reuses/${reuse.slug}`)}
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
            : "Reutilização")
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
            {`Atualizado ${format(new Date(reuse.last_modified || reuse.created_at), "dd MM yyyy", { locale: pt })}`}
          </span>
        }
        links={links}
        mainLink={
          <Link href={`/pages/reuses/${reuse.slug}`}>
            <span className="underline">{sanitizeUserMarkdown(reuse.title)}</span>
          </Link>
        }
        blockedLink={true}
      />
    </div>
  );
}
